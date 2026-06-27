import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // Light theme tokens
        bg: {
          DEFAULT: "#f7f7f8",     // page background (slightly off-white)
          panel: "#ffffff",        // raised panel (header, footer)
          card: "#ffffff",         // card surface
          elev: "#f1f3f5",         // hover / elevated surface
        },
        ink: {
          DEFAULT: "#0a0b0d",      // primary text
          muted: "#4b5563",        // secondary text
          dim: "#9ca3af",          // tertiary text
        },
        brand: {
          DEFAULT: "#d32f2f",
          50: "#fef2f2",
          100: "#fee2e2",
          400: "#f87171",
          500: "#ef4444",
          600: "#d32f2f",
          700: "#b91c1c",
        },
        // semantic surface modifiers (use these in addition to existing usages)
        hairline: "rgba(0,0,0,0.08)",
        ring: "#d32f2f",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "ui-sans-serif", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        "hero": ["72px", { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "800" }],
        "display": ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
      },
      backgroundImage: {
        "hero-glow": "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(211,47,47,0.10), transparent)",
        "brand-gradient": "linear-gradient(135deg, #d32f2f 0%, #f87171 100%)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
