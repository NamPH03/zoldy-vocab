import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
        },
        border: "var(--border-color)",
        tx: {
          DEFAULT: "var(--text)",
          muted: "var(--text-muted)",
          faint: "var(--text-faint)",
        },
      },
      fontFamily: {
        sans: ["Quicksand", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        "sky-sm": "0 1px 3px rgba(2,132,199,0.12), 0 1px 2px rgba(2,132,199,0.08)",
        "sky-md": "0 4px 16px rgba(2,132,199,0.15), 0 2px 4px rgba(2,132,199,0.08)",
        "sky-lg": "0 10px 40px rgba(2,132,199,0.18), 0 4px 8px rgba(2,132,199,0.10)",
        // Alias for backward compatibility
        "green-sm": "0 1px 3px rgba(2,132,199,0.12), 0 1px 2px rgba(2,132,199,0.08)",
        "green-md": "0 4px 16px rgba(2,132,199,0.15), 0 2px 4px rgba(2,132,199,0.08)",
        "green-lg": "0 10px 40px rgba(2,132,199,0.18), 0 4px 8px rgba(2,132,199,0.10)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.32, 0.72, 0, 1)",
        bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s cubic-bezier(0.32,0.72,0,1) both",
        "fade-in": "fadeIn 0.4s cubic-bezier(0.32,0.72,0,1) both",
        "slide-in": "slideIn 0.5s cubic-bezier(0.32,0.72,0,1) both",
        "scale-in": "scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
        "spin-slow": "spin 3s linear infinite",
        "pulse-sky": "pulseSky 2s ease-in-out infinite",
        "pulse-green": "pulseSky 2s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%":   { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%":   { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseSky: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(56,189,248,0.4)" },
          "50%":       { boxShadow: "0 0 0 8px rgba(56,189,248,0)" },
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};
export default config;
