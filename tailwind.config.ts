import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'rgb(var(--ink) / <alpha-value>)',
        paper: 'rgb(var(--paper) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        jade: {
          DEFAULT: 'rgb(var(--jade) / <alpha-value>)',
          soft: 'rgb(var(--jade-soft) / <alpha-value>)',
        },
        clay: {
          DEFAULT: 'rgb(var(--clay) / <alpha-value>)',
          soft: 'rgb(var(--clay-soft) / <alpha-value>)',
        },
        sand: {
          DEFAULT: 'rgb(var(--sand) / <alpha-value>)',
          soft: 'rgb(var(--sand-soft) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
      },
      boxShadow: {
        none: 'none',
      },
    },
  },
  plugins: [],
};

export default config;
