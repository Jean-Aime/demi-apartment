/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#E7A923',
          champagne: '#EEC456',
          light: '#F5D778',
          royal: '#D4A017',
          bronze: '#B87E25',
          metallic: '#B8860B',
          antique: '#A87919',
          // Accessible deep gold for small text on marble and ivory surfaces.
          ink: '#7A5710',
          deep: '#B8860B',
          soft: '#B87E25',
        },
        ink: {
          DEFAULT: '#080808',
          900: '#080808',
          800: '#15130F',
          700: '#23201A',
          600: '#3B362D',
          500: '#5D574B',
          400: '#7E7668',
          300: '#A59C8B',
          200: '#CFC7B6',
          100: '#E6E0D3',
        },
        paper: {
          DEFAULT: '#F7F7F6',
          warm: '#F2EEE4',
          muted: '#E9E3D6',
          deep: '#DCD3C2',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        ultra: '0.42em',
      },
      maxWidth: {
        site: '1440px',
      },
      boxShadow: {
        plate: '0 30px 80px -40px rgba(8, 8, 8, 0.45)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'hero-zoom': {
          '0%': { transform: 'scale(1.12)' },
          '100%': { transform: 'scale(1)' },
        },
        'marquee': {
          '0%': { transform: 'translate3d(0,0,0)' },
          '100%': { transform: 'translate3d(-50%,0,0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.7s ease-out both',
        'hero-zoom': 'hero-zoom 3s cubic-bezier(0.16, 1, 0.3, 1) both',
        marquee: 'marquee 42s linear infinite',
      },
    },
  },
  plugins: [],
};
