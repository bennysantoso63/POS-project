/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: 'var(--color-bg)',
          text: 'var(--color-text)',
          primary: '#4F46E5',
          secondary: '#6366F1',
          accent: '#F43F5E',
          muted: '#94A3B8',
          card: 'var(--color-card)',
          border: 'var(--color-border)'
        }
      }
    }
  },
  plugins: [],
}
