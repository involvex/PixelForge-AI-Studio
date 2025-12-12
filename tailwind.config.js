/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        pixel: ['"Press Start 2P"', "cursive"],
      },
      colors: {
        gray: {
          750: "#2d3748",
          850: "#1a202c",
          950: "#0d1117",
        },
      },
    },
  },
  plugins: [],
};
