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
        // CVora custom gradient colors
        primary: {
            DEFAULT: '#3b82f6', // blue-500
            dark: '#1d4ed8',   // blue-700
        },
        secondary: {
            DEFAULT: '#8b5cf6', // violet-500
            dark: '#6d28d9',   // violet-700
        }
      }
    },
  },
  plugins: [],
}
