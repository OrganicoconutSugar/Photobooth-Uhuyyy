export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', '"Courier New"', 'monospace'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      colors: {
        sage: {
          50: '#F8F9F6',
          100: '#F0F2EC',
          200: '#E2E8DC',
          300: '#C5D0B8',
          400: '#B5C7A8',
          500: '#9CAF88',
          600: '#7A9068',
          700: '#5A6E4A',
          800: '#2D3A2D',
        },
        paper: '#F4F4F0',
        ink: '#050505',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'ornament-spin': 'ornamentSpin 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        ornamentSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}
