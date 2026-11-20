/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // RShield deep-teal cybersecurity palette
        navy: {
          50: '#EDF7F6',
          100: '#D8ECE9',
          200: '#B7DCD7',
          700: '#246A65',
          800: '#19534F',
          900: '#103B42', // Primary dark navy
          950: '#0B262F', // Deepest dark navy
        },
        slate: {
          50: '#F3F7F7',
          100: '#EAF0EF',
          200: '#DCE6E4',
          300: '#C6D3D1',
          400: '#91A5A2',
          500: '#657B78',
          600: '#4B615E',
          700: '#354A48',
          800: '#263A39',
          900: '#172A2E',
          950: '#0D1D21',
        },
        // Semantic risk severity colors from reference VerdictBadge & gauge
        emerald: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          950: '#451A03',
        },
        red: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
          950: '#450A0A',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
