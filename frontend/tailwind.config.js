/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
            DEFAULT: '#663399',
            dark: '#4d2673',
            light: '#7a3db5',
        },
        secondary: {
            DEFAULT: '#663399',
            dark: '#4d2673',
            light: '#7a3db5',
        }
      }
    },
  },
  plugins: [],
}
