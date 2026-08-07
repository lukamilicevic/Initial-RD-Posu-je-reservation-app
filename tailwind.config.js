/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        deep: {
          green: '#154c28',
          mint: '#8fcf82'
        }
      },
      boxShadow: {
        soft: '0 12px 40px rgba(0, 0, 0, 0.08)'
      }
    }
  },
  plugins: []
};
