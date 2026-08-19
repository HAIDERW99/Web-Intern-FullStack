/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Haven Blue (Primary)
        primary: {
          DEFAULT: '#000000',
          container: '#131b2e',
          foreground: '#ffffff',
        },
        // Sunset Gold (Secondary / CTA)
        secondary: {
          DEFAULT: '#855300',
          container: '#fea619',
          foreground: '#ffffff',
          'on-container': '#684000',
        },
        // Surface palette
        surface: {
          DEFAULT: '#f7f9fb',
          dim: '#d8dadc',
          bright: '#f7f9fb',
          lowest: '#ffffff',
          low: '#f2f4f6',
          DEFAULT2: '#eceef0',
          high: '#e6e8ea',
          highest: '#e0e3e5',
        },
        outline: {
          DEFAULT: '#76777d',
          variant: '#c6c6cd',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
      boxShadow: {
        float: '0 10px 15px -3px rgba(15, 23, 42, 0.08)',
        card: '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
      },
    },
  },
  plugins: [],
};
