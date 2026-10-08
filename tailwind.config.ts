import type { Config } from "tailwindcss";

/**
 * Dr. Solanki blue DNA. Colors are driven by CSS variables (see app/globals.css)
 * so a single token swap re-skins the whole app once we have the real brand hex.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--primary)",
          deep: "var(--primary-deep)",
          soft: "var(--primary-soft)",
          tint: "var(--primary-tint)",
        },
        canvas: "var(--canvas)",
        surface: "var(--surface)",
        divider: "var(--divider)",
        ink: "var(--text)",
        muted: "var(--muted)",
        ok: "var(--success)",
        crit: "var(--crit)",
        rating: "var(--rating)",
        "rating-empty": "var(--rating-empty)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-poppins)", "var(--font-inter)", "sans-serif"],
        kn: ["var(--font-kn)", "var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        card: "20px",
        field: "13px",
      },
      boxShadow: {
        card: "0 8px 26px rgba(21,66,145,0.12)",
        soft: "0 3px 12px rgba(21,66,145,0.08)",
      },
      maxWidth: {
        form: "480px",
      },
    },
  },
  plugins: [],
};

export default config;
