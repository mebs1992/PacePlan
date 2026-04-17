import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0f172a',
          card: '#1e293b',
          elev: '#334155',
        },
        ink: {
          DEFAULT: '#f1f5f9',
          muted: '#94a3b8',
          dim: '#64748b',
        },
        risk: {
          green: '#22c55e',
          yellow: '#eab308',
          red: '#ef4444',
        },
        accent: '#38bdf8',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
