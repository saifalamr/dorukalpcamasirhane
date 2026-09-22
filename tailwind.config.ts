import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  // Class-based dark mode: <html class="dark">. Core colors are CSS variables
  // (see globals.css) so the whole surface flips with one class.
  darkMode: "class",
  // Inter variable font, loaded from Google Fonts in the root layout.
  theme: {
    extend: {
      colors: {
        // Core surfaces are CSS variables so dark mode flips them globally.
        // Defined as "R G B" channels to keep opacity modifiers (text-ink/60) working.
        ink: "rgb(var(--ink) / <alpha-value>)",
        paper: "rgb(var(--paper) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        white: "rgb(var(--surface) / <alpha-value>)",
        // Emphasized text (KPI numbers, totals): navy in light, gold in dark.
        accent: "rgb(var(--accent) / <alpha-value>)",
        slate: {
          850: "#1E2A2F",
        },
        // DORUK ALP brand palette (from the flyer): deep navy + gold.
        navy: {
          950: "#0E1A2B",
          900: "#152438",
          800: "#1E3252",
          700: "#2A4166",
          600: "#334E73",
          500: "#41608C",
        },
        gold: {
          600: "#B08D45",
          500: "#C9A45C",
          400: "#D8B878",
          100: "rgb(var(--gold-100) / <alpha-value>)",
        },
        teal: {
          950: "#0B2B2A",
          900: "#0F3B39",
          700: "#1F6F63",
          600: "#278073",
          500: "#3B9A87",
          100: "#E4F0EA",
          50: "#F1F7F4",
        },
        amber: {
          600: "#B5762A",
          500: "#C98A3C",
          100: "#F6E9D8",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "10px",
        md: "12px",
        lg: "16px",
        xl: "20px",
      },
      boxShadow: {
        // Soft, airy shadows for the smooth-modern feel.
        sm: "0 1px 2px rgba(21, 36, 56, 0.05)",
        DEFAULT: "0 2px 8px rgba(21, 36, 56, 0.07)",
        md: "0 4px 14px rgba(21, 36, 56, 0.09)",
        lg: "0 10px 30px rgba(21, 36, 56, 0.12)",
        xl: "0 16px 44px rgba(21, 36, 56, 0.16)",
      },
    },
  },
  plugins: [],
};
export default config;
