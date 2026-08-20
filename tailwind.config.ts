import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/admin-internal/**/*.{js,ts,jsx,tsx}",
    "./components/admin/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        admin: {
          bg: "#000000",
          surface: "#1c1c1e",
          panel: "#2c2c2e",
          elevated: "#3a3a3c",
          border: "rgba(255,255,255,0.08)",
          "border-strong": "rgba(255,255,255,0.14)",
          muted: "#98989d",
          text: "#f5f5f7",
          accent: "#0a84ff",
          danger: "#ff453a",
          success: "#30d158",
          warning: "#ffd60a",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        admin: "12px",
      },
      boxShadow: {
        "admin-soft": "0 2px 12px rgba(0,0,0,0.25)",
        admin: "0 8px 32px rgba(0,0,0,0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
