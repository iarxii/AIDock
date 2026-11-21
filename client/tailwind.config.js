/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--accent-primary, #0db7ed)',
          hover: 'var(--accent-hover, #0099cc)',
          subtle: 'var(--accent-subtle, rgba(13, 183, 237, 0.08))',
          border: 'var(--accent-border, rgba(13, 183, 237, 0.28))',
          glow: 'var(--accent-glow, rgba(13, 183, 237, 0.40))',
        },
        canvas: 'var(--bg-canvas)',
        surface: {
          DEFAULT: 'var(--bg-surface)',
          elevated: 'var(--bg-surface-elevated)',
          hover: 'var(--bg-surface-hover)',
          editor: 'var(--bg-editor)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          DEFAULT: 'var(--border-default)',
          strong: 'var(--border-strong)',
        },
        content: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          onBrand: 'var(--text-on-accent)',
        }
      },
      boxShadow: {
        l1: 'var(--shadow-l1)',
        l2: 'var(--shadow-l2)',
        modal: 'var(--shadow-modal)',
        brandGlow: '0 0 16px var(--accent-glow)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Cascadia Code"', '"Fira Code"', 'Consolas', 'monospace'],
      },
      borderRadius: {
        sm: 'var(--radius-sm, 4px)',
        md: 'var(--radius-md, 6px)',
        lg: 'var(--radius-lg, 10px)',
      }
    },
  },
  plugins: [],
}
