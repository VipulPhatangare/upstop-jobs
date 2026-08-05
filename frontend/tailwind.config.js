/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        unstop: {
          blue: '#1c4980',
          darkBlue: '#0f294a',
          accent: '#00c853',
          purple: '#6c5ce7',
          orange: '#ff7043',
          gray: '#f4f6fc',
          cardBorder: 'rgba(255, 255, 255, 0.08)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif']
      }
    },
  },
  plugins: [],
}
