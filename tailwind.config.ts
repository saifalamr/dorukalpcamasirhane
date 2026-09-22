import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1C2321",
        paper: "#F7F5F0",
        slate: {
          850: "#1E2A2F",
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
        line: "#DDD9CE",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        lg: "10px",
      },
    },
  },
  plugins: [],
};
export default config;
