/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/mainview/**/*.{html,js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cs: {
          bg: "var(--cs-bg)",
          surface: "var(--cs-surface)",
          "surface-2": "var(--cs-surface-2)",
          border: "var(--cs-border)",
          "border-subtle": "var(--cs-border-subtle)",
          "text-primary": "var(--cs-text-primary)",
          "text-secondary": "var(--cs-text-secondary)",
          "text-tertiary": "var(--cs-text-tertiary)",
          primary: "var(--cs-primary)",
          "primary-hover": "var(--cs-primary-hover)",
          "primary-subtle": "var(--cs-primary-subtle)",
          "primary-muted": "var(--cs-primary-muted)",
          accent: "var(--cs-accent)",
          success: "var(--cs-success)",
          warning: "var(--cs-warning)",
          error: "var(--cs-error)",
        },
      },
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
        mono: ["'DM Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
