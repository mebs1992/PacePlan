import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paper palette — light editorial
        bg: {
          DEFAULT: '#F4EFE4',
          deep: '#EBE3D2',
          card: '#FFFFFF',
          elev: '#EBE3D2',
          solid: '#F4EFE4',
        },
        ink: {
          DEFAULT: '#1A1712',
          muted: '#5D5547',
          dim: '#8A8374',
        },
        risk: {
          green: '#3A5E4C',
          'green-glow': 'rgba(58, 94, 76, 0.16)',
          yellow: '#B28034',
          'yellow-glow': 'rgba(178, 128, 52, 0.18)',
          red: '#8C3A2A',
          'red-glow': 'rgba(140, 58, 42, 0.18)',
        },
        accent: {
          DEFAULT: '#8C3A2A',
          violet: '#3A5E4C',
          glow: 'rgba(140, 58, 42, 0.18)',
        },
        line: '#D4C7A8',
        'line-2': '#C2B391',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Inter',
          'system-ui',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        display: [
          'Fraunces',
          'Cormorant Garamond',
          'Times New Roman',
          'Georgia',
          'serif',
        ],
        mono: [
          'JetBrains Mono',
          'SF Mono',
          'ui-monospace',
          'Menlo',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(26, 23, 18, 0.04), 0 8px 24px -12px rgba(26, 23, 18, 0.10)',
        'card-lg': '0 2px 4px rgba(26, 23, 18, 0.05), 0 16px 40px -16px rgba(26, 23, 18, 0.14)',
        fab: '0 10px 30px -10px rgba(140, 58, 42, 0.40), 0 2px 6px rgba(26, 23, 18, 0.08)',
        press: '0 1px 2px rgba(26, 23, 18, 0.06)',
      },
      keyframes: {
        breathe: {
          '0%,100%': { opacity: '0.85', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.03)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        breathe: 'breathe 2.6s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        'fade-in': 'fade-in 200ms ease-out both',
      },
    },
  },
  plugins: [],
} satisfies Config;
