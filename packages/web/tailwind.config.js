/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        jarvis: {
          bg: '#090d16',
          surface: '#0f172a',
          surfaceHover: '#1e293b',
          border: '#1e293b',
          borderHighlight: '#334155',
          cyan: '#06b6d4',
          emerald: '#10b981',
          rose: '#f43f5e',
          textMuted: '#94a3b8'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace']
      }
    },
  },
  plugins: [],
}
