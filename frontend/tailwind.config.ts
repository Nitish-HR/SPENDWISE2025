import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Use Geist as primary (already wired via CSS variable), Inter as fallback
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        background: "var(--bg-main)",
        foreground: "var(--text-primary)",
        "surface-card": "var(--surface-card)",
        "primary-main": "var(--primary-main)",
        "accent-main": "var(--accent-main)",
        "success-main": "var(--success-main)",
        "warning-main": "var(--warning-main)",
        "error-main": "var(--error-main)",
        "text-muted": "var(--text-muted)",
        "border-subtle": "var(--border-subtle)",
      },
      borderRadius: {
        card: "12px",
        input: "8px",
        pill: "999px",
      },
      boxShadow: {
        soft: "0 6px 20px rgba(2, 6, 23, 0.6)",
      },
      maxWidth: {
        "content-1200": "1200px",
      },
      transitionDuration: {
        fast: "280ms",
      },
    },
  },
  plugins: [],
};
export default config;
