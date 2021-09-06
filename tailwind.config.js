module.exports = {
  mode: 'jit',
  purge: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: false,
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3ebff',
          100: '#e6d6ff',
          200: '#cbaaff',
          300: '#ad7aff',
          400: '#934dff',
          500: '#7e14ff',
          600: '#6a10d6',
          700: '#540ba8',
          800: '#3d0780',
          900: '#26044f',
        },
        accent: {
          400: '#4de3f5',
          500: '#22d3ee',
          600: '#0ea5c4',
        },
        ink: {
          700: '#1a2140',
          800: '#11162b',
          900: '#0b1020',
          950: '#070a16',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(126,20,255,0.25), 0 20px 60px -15px rgba(126,20,255,0.45)',
        card: '0 30px 80px -30px rgba(0,0,0,0.75)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-18px)' },
        },
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.8s ease-out both',
        float: 'float 9s ease-in-out infinite',
        'gradient-pan': 'gradient-pan 12s ease infinite',
        shimmer: 'shimmer 2.5s linear infinite',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
