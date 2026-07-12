import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/admin-internal/**/*.{js,ts,jsx,tsx}",
    "./components/admin/cms/**/*.{js,ts,jsx,tsx}",
    "./components/admin/AdminShell.tsx",
  ],
  theme: {
    extend: {
      colors: {
        admin: {
          bg: "#0a0a0a",
          panel: "#141414",
          border: "#2a2a2a",
          muted: "#888",
          accent: "#5c9eff",
          danger: "#ef4444",
          success: "#22c55e",
        },
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
