/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hotel: {
          navy: {
            950: '#070C18',
            900: '#0C1527',
            800: '#14213D',
            700: '#1F3158',
            600: '#2A4374',
          },
          gold: {
            300: '#F3E5AB',
            400: '#E2C785',
            500: '#C8A951',
            600: '#B08F35',
            700: '#8A6D1F',
          },
          cream: '#FDFBF7',
          sand: '#F4EFEA',
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
