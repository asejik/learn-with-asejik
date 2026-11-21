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
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb", // Primary Electric Cobalt
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        editorial: {
          canvas: "#f8fafc",
          surface: "#ffffff",
          muted: "#f1f5f9",
          ink: "#0f172a",
          secondary: "#334155",
          border: "#e2e8f0",
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
