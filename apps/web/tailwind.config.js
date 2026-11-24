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
        surface: {
          dark: '#08090C',
          panel: '#0D1117',
          card: '#161B22',
        },
        brand: {
          blue: '#58A6FF',
          green: '#39D353',
          red: '#F85149',
          amber: '#D29922',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
