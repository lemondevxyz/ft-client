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
          '100%': { opacity: '1', display: 'block' },
          '0%': { opacity: '0', display: 'block' },
        },
        fadeOut: {
          '100%': { display: 'none', opacity: '0', visibility: 'hidden', },
          '99%': { opacity: '0' },
          '0%': { opacity: '1', display: 'block' },
        },
        popIn: {
          '100%': { transform: 'translateY(0px)', opacity: '1' },
          '0%': { transform: 'translateY(-5rem)', opacity: '0' },
        },
        popOut: {
          '100%': { transform: 'translateY(-5rem)', opacity: '0' },
          '0%': { transform: 'translateY(0px)', opacity: '1' },
        },
        leftFadeIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '50%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0%)', opacity: '1' },
        },
        leftFadeOut: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        fasterLeftFadeIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0%)', opacity: '1' },
        },
        fasterLeftFadeOut: {
          '0%': { transform: 'translateX(0%)', opacity: '1' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        toastIn: {
          '0%': { transform: 'translateY(2rem)', opacity: '0' },
          '100%': { transform: 'translateY(0px)', opacity: '1' },
        },
        toastOut: {
          '100%': { transform: 'translateY(-1rem)', opacity: '0' },
          '0%': { transform: 'translateY(0px)', opacity: '1' },
        },
      },
      animation: {
        toastIn: 'toastIn 250ms ease-in forwards',
        toastOut: 'toastOut 250ms ease-in forwards',
        fadeIn: 'fadeIn 250ms ease-in forwards',
        longFadeIn: 'fadeIn 1000ms ease-in forwards',
        fadeOut: 'fadeOut 250ms ease-in forwards',
        longFadeOut: 'fadeOut 1000ms ease-in forwards',
        popIn: 'popIn 250ms ease-in forwards',
        popOut: 'popOut 250ms ease-in forwards',
        leftFadeIn: 'leftFadeIn 1000ms ease-in-out forwards',
        leftFadeOut: 'leftFadeOut 750ms cubic-bezier(.34,.67,.66,.12) forwards',
        fasterLeftFadeIn:  'fasterLeftFadeIn 750ms cubic-bezier(.34,.67,.66,.12) forwards',
        fasterLeftFadeOut: 'fasterLeftFadeOut 1000ms cubic-bezier(.34,.67,.66,.12) forwards',
      }
    },
  },
  plugins: [],
}
