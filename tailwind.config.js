/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#B8954A',
          light: '#D4B068',
          soft: '#A88542',
          deep: '#7A6028',
        },
        ink: {
          DEFAULT: '#1A1815',
          900: '#0E0D0B',
          800: '#1A1815',
          700: '#2B2823',
          600: '#3D3933',
          500: '#5A544A',
          400: '#7A7268',
          300: '#9A9285',
          200: '#BFB8AD',
          100: '#D8D2C6',
        },
        paper: {
          DEFAULT: '#FFFFFF',
          warm: '#F8F6F1',
          muted: '#EFEAE0',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scroll-line': {
          '0%': { transform: 'scaleY(0)', transformOrigin: 'top' },
          '50%': { transform: 'scaleY(1)', transformOrigin: 'top' },
          '51%': { transform: 'scaleY(1)', transformOrigin: 'bottom' },
          '100%': { transform: 'scaleY(0)', transformOrigin: 'bottom' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.6s ease-out both',
        'scroll-line': 'scroll-line 2.4s cubic-bezier(0.65, 0, 0.35, 1) infinite',
      },
    },
  },
  plugins: [],
};
