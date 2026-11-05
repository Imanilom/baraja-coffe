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
        primary: '#8baa8b',
        'primary-dark': '#6d8c6d',
        'primary-light': '#e3ebe3',
        sage: {
          50: '#f4f7f4',
          100: '#e3ebe3',
          200: '#c5d5c5',
          300: '#a3bea3',
          400: '#8baa8b',
          500: '#729872',
          600: '#587a58',
          700: '#466146',
          800: '#394e39',
          900: '#304130',
        }
      }
    },
  },
  plugins: [],
}