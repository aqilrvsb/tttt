/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tiktok: {
          pink: '#ee1d52',
          cyan: '#69c9d0',
          black: '#010101',
        }
      }
    },
  },
  plugins: [],
}
