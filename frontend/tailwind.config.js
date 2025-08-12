/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
      },
      colors: {
        primary: {
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
        gray: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
        },
        // Option B: warm sand surface + copper accent
        surface: {
          50: '#faf7f2',
          100: '#f6f2ea',
          200: '#efe8db',
          300: '#e5dcc9',
          400: '#d6cbb3',
          500: '#c2b79f',
          600: '#a59682',
          700: '#8a7c6b',
          800: '#6f6557',
          900: '#5b5248'
        },
        accent: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a'
        }
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.06), 0 8px 24px rgba(16,24,40,.08)'
      },
      borderRadius: {
        soft: '14px'
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'in-up': 'enterUp 0.5s ease-out both',
        'in-down': 'enterDown 0.5s ease-out both',
        'in-left': 'enterLeft 0.5s ease-out both',
        'drawer-in': 'drawerIn 0.38s cubic-bezier(0.16,1,0.3,1) both',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        enterUp: {
          '0%': { transform: 'translateY(var(--enter-distance, 16px))', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        enterDown: {
          '0%': { transform: 'translateY(calc(var(--enter-distance, 16px) * -1))', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        enterLeft: {
          '0%': { transform: 'translateX(calc(var(--enter-distance, 16px) * -1))', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        drawerIn: {
          '0%': { transform: 'translateX(-24px)', opacity: '0' },
          '60%': { transform: 'translateX(2px)', opacity: '1' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      }
    },
  },
  plugins: [],
}