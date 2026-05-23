/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./apps/web/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Editorial Monocle
        editorial: {
          50: '#faf9f7',
          100: '#f5f3ef',
          200: '#e8e4dd',
          300: '#d4cfc4',
          400: '#b8b09e',
          500: '#9c917d',
          600: '#7d7465',
          700: '#5e584d',
          800: '#3f3b34',
          900: '#1f1d19',
        },
        // Modern Minimal
        minimal: {
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
        // Warm Soft
        warm: {
          50: '#fef9f3',
          100: '#fdf3e6',
          200: '#fbe6cc',
          300: '#f8d6a8',
          400: '#f4be7a',
          500: '#eea44c',
          600: '#e88a2e',
          700: '#c16d24',
          800: '#9a541e',
          900: '#733b18',
        },
        // Tech Utility
        tech: {
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
        // Brutalist Experimental
        brutalist: {
          50: '#ffffff',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};