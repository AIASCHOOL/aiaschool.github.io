/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors')
module.exports = {
  mode: 'jit',
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {
      fontSize: {
        'base': '1.75rem'
        // '2xl': '1.75rem',
        // '2xl': '1.75rem',
        // '3xl': '2rem',
      },
    },
  },
  variants: {},
  plugins: [],
}