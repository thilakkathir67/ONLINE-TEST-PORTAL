import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#040b1a",
          900: "#07142e",
          800: "#0b2147",
          700: "#123066",
        },
        neon: {
          500: "#18e1c5"
        }
      },
      boxShadow: {
        soft: "0 20px 60px rgba(0,0,0,0.35)"
      }
    },
  },
  plugins: [],
} satisfies Config;
