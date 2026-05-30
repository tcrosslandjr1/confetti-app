import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ['"Bricolage Grotesque"', '"Archivo Black"', "system-ui", "sans-serif"],
        serif: ['"Instrument Serif"', '"Times New Roman"', "serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        coral: "#FF5B3D",
        pink: "#EE5A9D",
        purple: "#5B45D9",
        teal: "#06D6A0",
        cyan: "#00C9DB",
        gold: "#F7C83B",
        indigo: "#0F1729",
        plum: "#1A1025",
        mocha: {
          DEFAULT: "#2B1410",
          dark: "#130B0D",
          light: "#3D1E18",
        },
        cream: {
          DEFAULT: "#F8F0DD",
          light: "#FFFAF0",
          muted: "#F2F2F7",
        },
      },
      borderRadius: {
        chip: "999px",
        card: "24px",
        phone: "48px",
      },
    },
  },
  plugins: [],
} satisfies Config;
