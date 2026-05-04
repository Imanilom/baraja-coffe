/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/react-tailwindcss-datepicker/dist/index.esm.js"
  ],
  // tailwind.config.js

  theme: {
    extend: {
      colors: {
        primary: '#005429',
        'primary-dark': '#003d1e',
        'primary-light': '#ebf5ee',
      }
    },
  },
  plugins: [],
}