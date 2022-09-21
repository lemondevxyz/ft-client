/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-border': 'rgba(0, 0, 0, 0.12)',
        'light-border': 'rgba(255, 255, 255, 0.12)',
        'light': '#f1f1f1',
        'dark': '#151515',
        'less-dark': "#333",
        'light-head': 'rgba(255, 255, 255, 0.87)',
        'light-body': 'rgba(255, 255, 255, 0.54)',
        'dark-head': 'rgba(0, 0, 0, 0.87)',
        'dark-body': 'rgba(0, 0, 0, 0.54)',
        'dark-disabled': 'rgba(0, 0, 0, 0.38)',
      },
      keyframes: {
        fadeIn: {
          '100%': { opacity: '1' },
          '0%': { opacity: '0' },
        },
        fadeOut: {
          '100%': { display: 'none', opacity: '0', visibility: 'hidden', },
          '99%': { opacity: '0' },
          '0%': { opacity: '1' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 250ms ease-in',
        fadeOut: 'fadeOut 250ms ease-in forwards',
      }
    },
  },
  plugins: [],
}
