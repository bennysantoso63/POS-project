/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: 'var(--brand-bg)',
          text: 'var(--brand-text)',
          primary: 'var(--brand-primary)',
          secondary: 'var(--brand-secondary)',
          card: 'var(--brand-card)',
          border: 'var(--brand-border)'
        }
      }
    }
  },
  plugins: [],
}
