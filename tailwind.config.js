/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float':          'float 6s ease-in-out infinite',
        'float-slow':     'float 9s ease-in-out infinite',
        'float-delayed':  'float 7s ease-in-out 2s infinite',
        'float-delay3':   'float 8s ease-in-out 3.5s infinite',
        'spin-slow':      'spin 30s linear infinite',
        'spin-reverse':   'spinReverse 24s linear infinite',
        'shimmer':        'shimmer 3s ease-in-out infinite',
        'shimmer-delay':  'shimmer 3s ease-in-out 1.5s infinite',
        'shimmer-delay2': 'shimmer 3s ease-in-out 0.8s infinite',
        'pulse-soft':     'pulseSoft 5s ease-in-out infinite',
        'fade-up':        'fadeUp 0.9s ease-out both',
        'scroll-line':    'scrollLine 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '33%':      { transform: 'translateY(-14px) rotate(4deg)' },
          '66%':      { transform: 'translateY(-7px) rotate(-2deg)' },
        },
        spinReverse: {
          from: { transform: 'rotate(360deg)' },
          to:   { transform: 'rotate(0deg)' },
        },
        shimmer: {
          '0%, 100%': { opacity: '0.2', transform: 'scale(0.85)' },
          '50%':      { opacity: '1',   transform: 'scale(1.15)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%':      { opacity: '0.6', transform: 'scale(1.06)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(28px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scrollLine: {
          '0%':  { transform: 'translateY(-100%)', opacity: '0' },
          '40%': { opacity: '1' },
          '100%':{ transform: 'translateY(100%)',  opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
