/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Palette Parenty — "Reassuring Professionalism" (voir DESIGN.md)
        // Teal doux pour la marque, neutres gris-bleus pour les surfaces,
        // orange subtil pour les accents et rouge adouci pour les erreurs.
        brand: {
          50: '#eff4ff',
          100: '#e6eeff',
          200: '#dce9ff',
          300: '#d5e3fc',
          400: '#6bd8cb',
          500: '#008378',
          600: '#00685f',
          700: '#005049',
          800: '#00332e',
          900: '#00201d',
        },
        primary: {
          DEFAULT: '#00685f',
          container: '#008378',
          fixed: '#89f5e7',
          'fixed-dim': '#6bd8cb',
        },
        'on-primary': '#ffffff',
        'on-primary-container': '#f4fffc',
        secondary: {
          DEFAULT: '#5c5f61',
          container: '#e0e3e5',
        },
        'on-secondary': '#ffffff',
        'on-secondary-container': '#626567',
        tertiary: {
          DEFAULT: '#994100',
          container: '#c05400',
          fixed: '#ffdbca',
          'fixed-dim': '#ffb690',
        },
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#fffbff',
        'on-tertiary-fixed': '#341100',
        'on-tertiary-fixed-variant': '#783200',
        surface: {
          DEFAULT: '#f8f9ff',
          dim: '#ccdbf3',
          bright: '#f8f9ff',
          'container-lowest': '#ffffff',
          'container-low': '#eff4ff',
          container: '#e6eeff',
          'container-high': '#dce9ff',
          'container-highest': '#d5e3fc',
          variant: '#d5e3fc',
        },
        'on-surface': '#0d1c2e',
        'on-surface-variant': '#3d4947',
        outline: {
          DEFAULT: '#6d7a77',
          variant: '#bcc9c6',
        },
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
        },
        'on-error': '#ffffff',
        'on-error-container': '#93000a',
        // Couleurs sémantiques de feedback (distinctes de primary/tertiary).
        // success = vert forêt (ne doit pas se confondre avec le teal de marque).
        // warning = ambre (distinct de l'orange tertiary).
        success: {
          DEFAULT: '#15803d',
          container: '#dcfce7',
        },
        'on-success': '#ffffff',
        'on-success-container': '#14532d',
        warning: {
          DEFAULT: '#b45309',
          container: '#fef3c7',
        },
        'on-warning': '#ffffff',
        'on-warning-container': '#78350f',
        background: '#f8f9ff',
        'on-background': '#0d1c2e',
      },
      fontFamily: {
        // Manrope pour tout — chaleureux + géométrique (voir DESIGN.md)
        sans: ['Manrope', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Manrope', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Échelle typo du DESIGN.md
        'display': ['40px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h2': ['32px', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'h3': ['24px', { lineHeight: '1.4', letterSpacing: '0', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '1.6', letterSpacing: '0', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '1.6', letterSpacing: '0', fontWeight: '400' }],
        'label-sm': ['14px', { lineHeight: '1.4', letterSpacing: '0.01em', fontWeight: '600' }],
        'caption': ['12px', { lineHeight: '1.4', letterSpacing: '0.02em', fontWeight: '500' }],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        '2xl': '1.75rem',
        '3xl': '2rem',
        full: '9999px',
      },
      boxShadow: {
        // Ombres teintées teal pour conserver la marque même dans la profondeur
        soft: '0 4px 24px rgba(13, 148, 136, 0.04)',
        card: '0 4px 24px rgba(13, 148, 136, 0.06)',
        'card-hover': '0 8px 32px rgba(13, 148, 136, 0.10)',
        nav: '0 -4px 20px rgba(13, 148, 136, 0.06)',
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '48px',
      },
    },
  },
  plugins: [],
}
