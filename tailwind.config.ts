import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#FFF8F1',
          deep: '#FBF2E8',
          card: '#FFFFFF',
          elev: '#FAF3EA',
          solid: '#FFF8F1',
        },
        ink: {
          DEFAULT: '#1A1512',
          muted: '#6B6257',
          dim: '#A89F95',
        },
        risk: {
          green: '#2E9E6B',
          'green-glow': 'rgba(46, 158, 107, 0.18)',
          yellow: '#E8A33A',
          'yellow-glow': 'rgba(232, 163, 58, 0.22)',
          red: '#E5484D',
          'red-glow': 'rgba(229, 72, 77, 0.22)',
        },
        accent: {
          DEFAULT: '#FF5A5F',
          violet: '#F4A261',
          glow: 'rgba(255, 90, 95, 0.22)',
        },
        line: '#EDE3D6',
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
          '-apple-system',
          'BlinkMacSystemFont',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(26, 21, 18, 0.04), 0 8px 24px -12px rgba(26, 21, 18, 0.10)',
        'card-lg': '0 2px 4px rgba(26, 21, 18, 0.05), 0 16px 40px -16px rgba(26, 21, 18, 0.14)',
        fab: '0 10px 24px -8px rgba(255, 90, 95, 0.45), 0 2px 6px rgba(26, 21, 18, 0.08)',
        press: '0 1px 2px rgba(26, 21, 18, 0.06)',
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
      },
      animation: {
        breathe: 'breathe 2.6s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
