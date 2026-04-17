import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0a0e1a',
          deep: '#05070d',
          card: 'rgba(30, 41, 59, 0.45)',
          elev: 'rgba(51, 65, 85, 0.55)',
          solid: '#0f172a',
        },
        ink: {
          DEFAULT: '#f8fafc',
          muted: '#94a3b8',
          dim: '#64748b',
        },
        risk: {
          green: '#10b981',
          'green-glow': 'rgba(16, 185, 129, 0.35)',
          yellow: '#f59e0b',
          'yellow-glow': 'rgba(245, 158, 11, 0.35)',
          red: '#f43f5e',
          'red-glow': 'rgba(244, 63, 94, 0.35)',
        },
        accent: {
          DEFAULT: '#22d3ee',
          violet: '#a78bfa',
          glow: 'rgba(34, 211, 238, 0.35)',
        },
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
          'ui-rounded',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif',
        ],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glow: '0 0 40px rgba(34, 211, 238, 0.25)',
        card: '0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
      },
      keyframes: {
        breathe: {
          '0%,100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.04)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.6' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
      },
      animation: {
        breathe: 'breathe 3s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        ripple: 'ripple 0.6s ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
