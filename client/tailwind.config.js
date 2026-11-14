/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F6F2',
        surface: '#FFFFFF',
        borderline: '#E4E2DB',
        ink: {
          DEFAULT: '#1E1E1C',
          muted: '#6B6A64',
          faint: '#9A988F',
        },
        risk: {
          green: {
            text: '#3F7A5C',
            bg: '#EAF3EE',
            border: '#cde4d6',
            ring: '#3F7A5C',
          },
          amber: {
            text: '#B4863C',
            bg: '#FBF3E4',
            border: '#edd9b5',
            ring: '#C9941D',
          },
          red: {
            text: '#B23A3A',
            bg: '#FBEBEB',
            border: '#f5c6c6',
            ring: '#B23A3A',
          },
          gray: {
            text: '#6B6A64',
            bg: '#F0EFEA',
            border: '#E4E2DB',
            ring: '#9A988F',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
