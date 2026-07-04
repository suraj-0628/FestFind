/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        neon: {
          blue: "#00d4ff",
          emerald: "#10b981",
          pink: "#ec4899",
        },
        surface: {
          base: "#0a0a0f",
          raised: "#0f1117",
          elevated: "#1a1d27",
          hover: "#22252f",
          active: "#2a2d3a",
        },
        border: {
          subtle: "rgba(255,255,255,0.06)",
          DEFAULT: "rgba(255,255,255,0.10)",
          strong: "rgba(255,255,255,0.16)",
        },
      },
      fontFamily: {
        sans: ['"Sora"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        display: ["1.5rem", { lineHeight: "1.2", fontWeight: "700" }],
        heading: ["1.125rem", { lineHeight: "1.3", fontWeight: "600" }],
        subhead: ["0.9375rem", { lineHeight: "1.4", fontWeight: "600" }],
        body: ["0.875rem", { lineHeight: "1.5", fontWeight: "400" }],
        caption: ["0.75rem", { lineHeight: "1.4", fontWeight: "500" }],
        overline: ["0.6875rem", { lineHeight: "1.3", fontWeight: "600" }],
        micro: ["0.625rem", { lineHeight: "1.3", fontWeight: "500" }],
      },
      spacing: {
        "0.5x": "2px",
        "1x": "4px",
        "1.5x": "6px",
        "2x": "8px",
        "3x": "12px",
        "4x": "16px",
        "5x": "20px",
        "6x": "24px",
        "8x": "32px",
        "10x": "40px",
        "12x": "48px",
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        pill: "9999px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,0.3)",
        md: "0 4px 12px rgba(0,0,0,0.4)",
        lg: "0 8px 24px rgba(0,0,0,0.5)",
        glow: "0 0 20px rgba(0,212,255,0.15)",
      },
      transitionDuration: {
        fast: "150ms",
        normal: "200ms",
        slow: "300ms",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.4, 0, 0.2, 1)",
        decelerate: "cubic-bezier(0, 0, 0.2, 1)",
        accelerate: "cubic-bezier(0.4, 0, 1, 1)",
        bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
