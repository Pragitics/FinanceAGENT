import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0f172a",
        card: "#1e293b",
        accent: "#38bdf8",
        positive: "#10b981",
        negative: "#ef4444",
      },
      borderRadius: {
        lg: "0.75rem",
      },
      boxShadow: {
        card: "0 15px 35px -15px rgba(15, 23, 42, 0.7)",
      },
    },
  },
  plugins: [],
};

export default config;
