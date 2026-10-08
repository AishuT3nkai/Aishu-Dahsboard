import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#0a0b0f",
          900: "#121319",
          850: "#171923",
          800: "#1c1f2b",
          750: "#22263381",
          700: "#2a2f3f",
          600: "#3a4055",
          500: "#565d78",
          400: "#7b8299",
          300: "#a6acbf",
          200: "#d3d6e0",
          100: "#eef0f5",
        },
        accent: {
          DEFAULT: "#7c8cff",
          dim: "#5865f2",
          bright: "#9aa5ff",
        },
        good: "#3fb87f",
        warn: "#e0a63f",
        bad: "#e05252",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
