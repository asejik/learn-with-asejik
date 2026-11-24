import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm editorial palette (docs/DESIGN.md section 2). `white` is warm
        // card paper and `slate` is the warm ink-to-paper neutral scale, so
        // every existing class picks up the new look from here.
        white: "#fbf7ef",
        slate: {
          50: "#f6efe3", // page paper
          100: "#efe6d6",
          200: "#d9cdbb", // hairlines
          300: "#c4b6a1",
          400: "#8f8070", // icons only
          500: "#6b5e52", // muted text
          600: "#5a4e43",
          700: "#4a4037", // body text
          800: "#2e2721",
          900: "#1b1612", // ink
        },
        brand: {
          50: "#fbebdd",
          100: "#f6d5bd",
          200: "#efbf9c",
          300: "#e3a074",
          500: "#c65f2b",
          600: "#a94a1c", // Terracotta: primary actions
          700: "#8f3c14",
          800: "#732f0f",
          900: "#5a250c",
        },
        editorial: {
          canvas: "#f6efe3",
          surface: "#fbf7ef",
          muted: "#efe6d6",
          ink: "#1b1612",
          secondary: "#4a4037",
          border: "#d9cdbb",
        },
        feedback: {
          correctBg: "#ecfdf5",
          correctBorder: "#059669",
          correctText: "#065f46",
          incorrectBg: "#fffbeb",
          incorrectBorder: "#d97706",
          incorrectText: "#92400e",
          infoBg: "#f0f9ff",
          infoBorder: "#0284c7",
          infoText: "#075985",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      minHeight: {
        tap: "44px",
      },
      minWidth: {
        tap: "44px",
      },
    },
  },
  plugins: [],
};

export default config;
