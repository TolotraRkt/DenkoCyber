module.exports = {
  mode: 'jit',
  purge: [
    './index.html',
    './src/**/*.{js,jsx}',
    // Classes utilisées dans des template literals (non détectées sinon).
    './src/tailwind-safelist.jsx',
  ],
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
        // Palettes absentes du thème Tailwind v2.2 installé : on les ajoute
        // pour pouvoir utiliser bg-slate-*, text-emerald-*, etc.
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        sky: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
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
