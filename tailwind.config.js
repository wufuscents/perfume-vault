/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#0A0A0A', // Deep pure black background
          900: '#121212', // Dark card container fill
          800: '#1C1C1C', // Higher contrast surface / hover fill
        },
        gold: {
          400: '#FACC15',
          500: '#EAB308', // Primary metallic gold highlight
          600: '#CA8A04',
        }
      }
    },
  },
  plugins: [],
}
