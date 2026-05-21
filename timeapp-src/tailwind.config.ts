import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        coral: "#FF6B6B",
        pink: "#EE5A9D",
        purple: "#8B5CF6",
        teal: "#06D6A0",
        cyan: "#00C9DB",
        gold: "#FFD166",
        indigo: "#0F1729",
        plum: "#1A1025"
      }
    }
  },
  plugins: []
} satisfies Config;
