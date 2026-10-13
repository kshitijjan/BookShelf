/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#f7f4ed',
          surface: '#f7f4ed',
          border: '#eceae4',
        },
        charcoal: {
          DEFAULT: '#1c1c1c',
          muted: '#5f5f5d',
          interactive: 'rgba(28, 28, 28, 0.4)',
          83: 'rgba(28, 28, 28, 0.83)',
          82: 'rgba(28, 28, 28, 0.82)',
          40: 'rgba(28, 28, 28, 0.4)',
          4: 'rgba(28, 28, 28, 0.04)',
          3: 'rgba(28, 28, 28, 0.03)',
        },
        offwhite: '#fcfbf8',
      },
      fontFamily: {
        sans: ['"Camera Plain Variable"', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        editorial: ['"Camera Plain Variable"', 'ui-sans-serif', 'Georgia', 'serif'],
        serif: ['"Playfair Display"', 'Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
      },
      letterSpacing: {
        'tight-hero': '-1.5px',
        'tight-section': '-1.2px',
        'tight-sub': '-0.9px',
      },
      boxShadow: {
        'button-inset': 'rgba(255, 255, 255, 0.2) 0px 0.5px 0px 0px inset, rgba(0, 0, 0, 0.2) 0px 0px 0px 0.5px inset, rgba(0, 0, 0, 0.05) 0px 1px 2px 0px',
        'pill-inset': 'rgba(255, 255, 255, 0.2) 0px 0.5px 0px 0px inset, rgba(0, 0, 0, 0.2) 0px 0px 0px 0.5px inset, rgba(0, 0, 0, 0.05) 0px 1px 2px 0px',
        'focus-warm': 'rgba(0, 0, 0, 0.1) 0px 4px 12px',
        'book-sheet': '0 4px 20px -2px rgba(28, 28, 28, 0.06), 0 2px 6px -1px rgba(28, 28, 28, 0.04)',
        'book-spine': 'inset 16px 0 28px -12px rgba(28, 28, 28, 0.09), inset -4px 0 10px -4px rgba(28, 28, 28, 0.04)',
      },
      borderRadius: {
        card: '12px',
        container: '16px',
        standard: '6px',
        compact: '8px',
        micro: '4px',
      }
    },
  },
  plugins: [],
}
