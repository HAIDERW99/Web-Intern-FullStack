/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Velocity Premium Design System
        'deep-navy':   '#001839',
        'navy-mid':    '#002c5f',
        'accent-red':  '#bb0014',
        'red-bright':  '#e41f25',
        'slate-gray':  '#4A5568',
        'ice-white':   '#FFFFFF',
        'success':     '#10B981',

        surface:                  '#f7fafc',
        'surface-dim':            '#d7dadc',
        'surface-bright':         '#f7fafc',
        'surface-container-lowest': '#ffffff',
        'surface-container-low':  '#f1f4f6',
        'surface-container':      '#ebeef0',
        'surface-container-high': '#e5e9eb',
        'surface-container-highest': '#e0e3e5',
        'on-surface':             '#181c1e',
        'on-surface-variant':     '#43474f',
        outline:                  '#747780',
        'outline-variant':        '#c4c6d1',
      },
      fontFamily: {
        grotesk: ['"Hanken Grotesk"', 'sans-serif'],
        inter:   ['Inter', 'sans-serif'],
      },
      fontSize: {
        'display-lg':  ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'headline-lg-mobile': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'headline-sm': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body-lg':     ['18px', { lineHeight: '28px' }],
        'body-md':     ['16px', { lineHeight: '24px' }],
        'body-sm':     ['14px', { lineHeight: '20px' }],
        'label-bold':  ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '600' }],
      },
      boxShadow: {
        card:       '0 4px 20px rgba(0, 26, 53, 0.05)',
        'card-hover': '0 8px 32px rgba(0, 26, 53, 0.12)',
        widget:     '0 8px 40px rgba(0, 26, 53, 0.18)',
      },
      borderRadius: {
        sm:   '0.125rem',
        DEFAULT: '0.25rem',
        md:   '0.375rem',
        lg:   '0.5rem',
        xl:   '0.75rem',
        full: '9999px',
      },
      maxWidth: {
        container: '1280px',
      },
    },
  },
  plugins: [],
}
