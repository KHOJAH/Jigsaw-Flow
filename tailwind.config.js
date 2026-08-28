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
        "outline": "#717973",
        "surface": "#fff8f4",
        "secondary": "#755845",
        "tertiary-fixed": "#ffdbd0",
        "outline-variant": "#c1c8c2",
        "secondary-fixed": "#ffdcc6",
        "on-secondary-fixed": "#2b1708",
        "on-tertiary-fixed": "#341005",
        "secondary-fixed-dim": "#e5bfa8",
        "tertiary-fixed-dim": "#fab7a1",
        "surface-bright": "#fff8f4",
        "primary-fixed": "#c0edd3",
        "tertiary-container": "#5e3122",
        "error": "#ba1a1a",
        "on-secondary-container": "#7a5c49",
        "surface-dim": "#e4d8ce",
        "on-error": "#ffffff",
        "on-surface": "#201a15",
        "inverse-primary": "#a5d0b8",
        "primary-fixed-dim": "#a5d0b8",
        "on-primary-fixed": "#002114",
        "primary": "#032f1e",
        "surface-container-low": "#fef1e7",
        "error-container": "#ffdad6",
        "tertiary": "#441c0f",
        "on-primary-container": "#88b29b",
        "surface-container-high": "#f3e6dc",
        "on-tertiary-fixed-variant": "#693a2b",
        "secondary-container": "#ffd8c0",
        "on-background": "#201a15",
        "surface-container": "#f9ece2",
        "on-error-container": "#93000a",
        "primary-container": "#1d4533",
        "surface-variant": "#ede0d6",
        "on-primary-fixed-variant": "#274e3c",
        "on-tertiary-container": "#d99985",
        "background": "#fff8f4",
        "surface-container-lowest": "#ffffff",
        "on-primary": "#ffffff",
        "inverse-on-surface": "#fceee4",
        "inverse-surface": "#362f29",
        "on-surface-variant": "#414844",
        "on-secondary-fixed-variant": "#5b412f",
        "surface-tint": "#3f6653",
        "surface-container-highest": "#ede0d6",
        "on-secondary": "#ffffff",
        "on-tertiary": "#ffffff"
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
