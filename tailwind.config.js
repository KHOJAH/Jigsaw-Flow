/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "outline": "var(--color-outline)",
        "surface": "var(--color-surface)",
        "secondary": "var(--color-secondary)",
        "tertiary-fixed": "var(--color-tertiary-fixed)",
        "outline-variant": "var(--color-outline-variant)",
        "secondary-fixed": "var(--color-secondary-fixed)",
        "on-secondary-fixed": "var(--color-on-secondary-fixed)",
        "on-tertiary-fixed": "var(--color-on-tertiary-fixed)",
        "secondary-fixed-dim": "var(--color-secondary-fixed-dim)",
        "tertiary-fixed-dim": "var(--color-tertiary-fixed-dim)",
        "surface-bright": "var(--color-surface-bright)",
        "primary-fixed": "var(--color-primary-fixed)",
        "tertiary-container": "var(--color-tertiary-container)",
        "error": "var(--color-error)",
        "on-secondary-container": "var(--color-on-secondary-container)",
        "surface-dim": "var(--color-surface-dim)",
        "on-error": "var(--color-on-error)",
        "on-surface": "var(--color-on-surface)",
        "inverse-primary": "var(--color-inverse-primary)",
        "primary-fixed-dim": "var(--color-primary-fixed-dim)",
        "on-primary-fixed": "var(--color-on-primary-fixed)",
        "primary": "var(--color-primary)",
        "surface-container-low": "var(--color-surface-container-low)",
        "error-container": "var(--color-error-container)",
        "tertiary": "var(--color-tertiary)",
        "on-primary-container": "var(--color-on-primary-container)",
        "surface-container-high": "var(--color-surface-container-high)",
        "on-tertiary-fixed-variant": "var(--color-on-tertiary-fixed-variant)",
        "secondary-container": "var(--color-secondary-container)",
        "on-background": "var(--color-on-background)",
        "surface-container": "var(--color-surface-container)",
        "on-error-container": "var(--color-on-error-container)",
        "primary-container": "var(--color-primary-container)",
        "surface-variant": "var(--color-surface-variant)",
        "on-primary-fixed-variant": "var(--color-on-primary-fixed-variant)",
        "on-tertiary-container": "var(--color-on-tertiary-container)",
        "background": "var(--color-background)",
        "surface-container-lowest": "var(--color-surface-container-lowest)",
        "on-primary": "var(--color-on-primary)",
        "inverse-on-surface": "var(--color-inverse-on-surface)",
        "inverse-surface": "var(--color-inverse-surface)",
        "on-surface-variant": "var(--color-on-surface-variant)",
        "on-secondary-fixed-variant": "var(--color-on-secondary-fixed-variant)",
        "surface-tint": "var(--color-surface-tint)",
        "surface-container-highest": "var(--color-surface-container-highest)",
        "on-secondary": "var(--color-on-secondary)",
        "on-tertiary": "var(--color-on-tertiary)"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "md": "16px",
        "xs": "4px",
        "gutter": "20px",
        "sidebar-width": "280px",
        "toolbar-height": "48px",
        "sm": "8px",
        "xl": "40px",
        "unit": "4px",
        "lg": "24px"
      },
      fontFamily: {
        "headline-lg": ["Manrope", "sans-serif"],
        "body-lg": ["Hanken Grotesk", "sans-serif"],
        "label-sm": ["Hanken Grotesk", "sans-serif"],
        "body-md": ["Hanken Grotesk", "sans-serif"],
        "display-lg": ["Manrope", "sans-serif"],
        "headline-md": ["Manrope", "sans-serif"],
        "label-md": ["Hanken Grotesk", "sans-serif"]
      }
    }
  },
  plugins: []
}
