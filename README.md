# Hangover Buddy

A mobile-first PWA that helps you pace your drinking to avoid a hangover. Estimates blood alcohol concentration in real time using the Widmark formula with food-modulated absorption, and tells you when to slow down or stop.

## Stack

Vite + React + TypeScript + Tailwind + Zustand + vite-plugin-pwa.
All data is stored in `localStorage` — no backend, no accounts, no tracking.

## Develop

```bash
npm install
npm run dev
```

## Build & deploy

```bash
npm run build
```

Deploys cleanly to Vercel (`vercel --prod`) or Render as a static site. The included `vercel.json` rewrites all routes to `/` so the SPA handles routing.

## Disclaimer

Estimates only. Never use this app to decide if you can drive. The only safe BAC for driving is 0.00.
