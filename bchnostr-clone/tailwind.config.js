/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'x-bg': '#000000',
        'x-sidebar': 'rgba(0, 0, 0, 0.97)',
        'x-gray': '#2F3336',
        'x-light-gray': '#71767B',
        'x-blue': '#1D9BF0',
        'x-green': '#00BA7C',
        'x-red': '#F4212E',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      height: {
        'screen-dynamic': '100dvh',
      },
      minHeight: {
        'screen-dynamic': '100dvh',
      },
    },
  },
  plugins: [],
}