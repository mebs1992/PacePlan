import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // PacePlan v1 visual system
        bg: {
          DEFAULT: '#0F172A',
          deep: '#111C31',
          card: '#1E293B',
          elev: '#273449',
          solid: '#0F172A',
        },
        ink: {
          DEFAULT: '#E6EDF5',
          muted: '#9FB0C3',
          dim: '#6B7C93',
        },
        risk: {
          green: '#22C55E',
          'green-glow': 'rgba(34, 197, 94, 0.16)',
          yellow: '#F59E0B',
          'yellow-glow': 'rgba(245, 158, 11, 0.18)',
          red: '#EF4444',
          'red-glow': 'rgba(239, 68, 68, 0.18)',
        },
        accent: {
          DEFAULT: '#6366F1',
          violet: '#6366F1',
          glow: 'rgba(99, 102, 241, 0.24)',
        },
        warm: {
          sand: '#F1E9DA',
          peach: '#E8CFC5',
        },
        sky: '#38BDF8',
        line: 'rgba(255, 255, 255, 0.06)',
        'line-2': 'rgba(255, 255, 255, 0.12)',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        display: [
          'Canela',
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
        card: '0 1px 2px rgba(0, 0, 0, 0.18), 0 16px 34px -22px rgba(0, 0, 0, 0.55)',
        'card-lg': '0 2px 4px rgba(0, 0, 0, 0.2), 0 26px 54px -24px rgba(0, 0, 0, 0.62)',
        fab: '0 12px 34px -12px rgba(99, 102, 241, 0.54), 0 2px 8px rgba(0, 0, 0, 0.2)',
        press: '0 1px 2px rgba(0, 0, 0, 0.24)',
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
