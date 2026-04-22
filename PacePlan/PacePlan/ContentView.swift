//
//  ContentView.swift
//  PacePlan
//
//  Created by Marcus Ebbeck on 21/4/2026.
//

import SwiftUI
import UIKit
import UniformTypeIdentifiers
import WebKit

struct ContentView: View {
    @State private var isWebAppLoading = true

    var body: some View {
        Group {
            if Bundle.main.url(forResource: "index", withExtension: "html") != nil
                || Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "WebApp") != nil {
                ZStack {
                    BundledWebView(isLoading: $isWebAppLoading)
                        .ignoresSafeArea()

                    if isWebAppLoading {
                        SplashView()
                            .transition(.opacity)
                    }
                }
                .animation(.easeOut(duration: 0.2), value: isWebAppLoading)
            } else {
                MissingWebAppView()
            }
        }
        .background(Color(.systemBackground))
    }
}

private struct BundledWebView: UIViewRepresentable {
    @Binding var isLoading: Bool

    func makeCoordinator() -> Coordinator {
        Coordinator(isLoading: $isLoading)
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.setURLSchemeHandler(BundleSchemeHandler(), forURLScheme: BundleSchemeHandler.scheme)

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.scrollView.bounces = false
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear

        if #available(iOS 16.4, *) {
            webView.isInspectable = true
        }

        context.coordinator.setLoading(true)
        let request = URLRequest(url: BundleSchemeHandler.entryURL)
        webView.load(request)
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}
}

extension BundledWebView {
    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        private var isLoading: Binding<Bool>
        private let externalSchemes: Set<String> = ["http", "https", "mailto", "tel"]

        init(isLoading: Binding<Bool>) {
            self.isLoading = isLoading
        }

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            guard let url = navigationAction.request.url,
                  let scheme = url.scheme?.lowercased() else {
                decisionHandler(.cancel)
                return
            }

            if scheme == BundleSchemeHandler.scheme || scheme == "about" {
                decisionHandler(.allow)
                return
            }

            if externalSchemes.contains(scheme) {
                openExternally(url)
            }

            decisionHandler(.cancel)
        }

        func webView(
            _ webView: WKWebView,
            createWebViewWith configuration: WKWebViewConfiguration,
            for navigationAction: WKNavigationAction,
            windowFeatures: WKWindowFeatures
        ) -> WKWebView? {
            if let url = navigationAction.request.url,
               let scheme = url.scheme?.lowercased(),
               externalSchemes.contains(scheme) {
                openExternally(url)
            }
            return nil
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            setLoading(true)
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            setLoading(false)
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: any Error) {
            setLoading(false)
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: any Error) {
            setLoading(false)
        }

        func setLoading(_ loading: Bool) {
            DispatchQueue.main.async {
                self.isLoading.wrappedValue = loading
            }
        }

        private func openExternally(_ url: URL) {
            guard UIApplication.shared.canOpenURL(url) else { return }
            UIApplication.shared.open(url)
        }
    }
}

private final class BundleSchemeHandler: NSObject, WKURLSchemeHandler {
    static let scheme = "paceplan"
    static let entryURL = URL(string: "\(scheme)://app/index.html")!

    func webView(_ webView: WKWebView, start urlSchemeTask: any WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url else {
            urlSchemeTask.didFailWithError(NSError(domain: NSURLErrorDomain, code: NSURLErrorBadURL))
            return
        }

        let relativePath = requestedRelativePath(for: url)
        guard let fileURL = bundledFileURL(for: relativePath) else {
            urlSchemeTask.didFailWithError(NSError(domain: NSCocoaErrorDomain, code: NSFileNoSuchFileError))
            return
        }

        do {
            let data = try Data(contentsOf: fileURL)
            let response = URLResponse(
                url: url,
                mimeType: mimeType(for: fileURL.pathExtension),
                expectedContentLength: data.count,
                textEncodingName: textEncodingName(for: fileURL.pathExtension)
            )
            urlSchemeTask.didReceive(response)
            urlSchemeTask.didReceive(data)
            urlSchemeTask.didFinish()
        } catch {
            urlSchemeTask.didFailWithError(error)
        }
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: any WKURLSchemeTask) {}

    private func requestedRelativePath(for url: URL) -> String {
        let candidate = url.path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        return candidate.isEmpty ? "index.html" : candidate.removingPercentEncoding ?? candidate
    }

    private func bundledFileURL(for relativePath: String) -> URL? {
        let nsRelativePath = relativePath as NSString
        let lastComponent = nsRelativePath.lastPathComponent as NSString
        let name = lastComponent.deletingPathExtension
        let ext = lastComponent.pathExtension
        let subdirectory = nsRelativePath.deletingLastPathComponent

        if !subdirectory.isEmpty && subdirectory != ".",
           let url = Bundle.main.url(forResource: name, withExtension: ext, subdirectory: subdirectory) {
            return url
        }

        if let url = Bundle.main.url(forResource: name, withExtension: ext) {
            return url
        }

        if let url = Bundle.main.url(forResource: name, withExtension: ext, subdirectory: "assets") {
            return url
        }

        if !subdirectory.isEmpty && subdirectory != ".",
           let url = Bundle.main.url(
            forResource: name,
            withExtension: ext,
            subdirectory: "WebApp/\(subdirectory)"
           ) {
            return url
        }

        if let url = Bundle.main.url(forResource: name, withExtension: ext, subdirectory: "WebApp/assets") {
            return url
        }

        return Bundle.main.url(forResource: name, withExtension: ext, subdirectory: "WebApp")
    }

    private func mimeType(for pathExtension: String) -> String {
        if pathExtension == "js" {
            return "text/javascript"
        }
        return UTType(filenameExtension: pathExtension)?.preferredMIMEType ?? "application/octet-stream"
    }

    private func textEncodingName(for pathExtension: String) -> String? {
        switch pathExtension {
        case "html", "css", "js", "svg":
            return "utf-8"
        default:
            return nil
        }
    }
}

private struct SplashView: View {
    private let backgroundColor = Color(red: 244 / 255, green: 239 / 255, blue: 228 / 255)
    private let accentColor = Color(red: 140 / 255, green: 58 / 255, blue: 42 / 255)

    var body: some View {
        ZStack {
            backgroundColor
                .ignoresSafeArea()

            VStack(spacing: 18) {
                Image("BrandMark")
                    .resizable()
                    .interpolation(.high)
                    .scaledToFit()
                    .frame(width: 164, height: 164)
                    .accessibilityHidden(true)

                Text("PacePlan")
                    .font(.custom("Georgia-Bold", size: 32))
                    .tracking(-0.4)
                    .foregroundStyle(accentColor)
            }
            .padding(.horizontal, 24)
        }
    }
}

private struct MissingWebAppView: View {
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "tray.and.arrow.down")
                .font(.system(size: 28))
            Text("Web app bundle missing")
                .font(.headline)
            Text("Run the iOS web build so PacePlan can load the bundled React app.")
                .font(.subheadline)
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
        }
        .padding(24)
    }
}

#Preview {
    ContentView()
}
