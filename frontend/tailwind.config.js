/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // EVA palette based on docs (flattened for Tailwind v4)
        'eva-bg': '#0F0F0F',
        'eva-primary': '#7E1012',    // NERV red
        'eva-secondary': '#A8FF60',  // EVA green
        'eva-accent': '#965FD4',     // EVA-01 purple
        'eva-text': '#FFFFFF',
        'eva-surface': '#1A1A1A',
      },
    },
  },
  plugins: [],
}

