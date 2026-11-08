import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "zen-primary": "rgb(var(--zen-color-primary) / <alpha-value>)",
        "zen-primary-hover": "rgb(var(--zen-color-primary-hover) / <alpha-value>)",
        "zen-black": "rgb(var(--zen-color-foreground) / <alpha-value>)",
        "zen-surface": "rgb(var(--zen-color-surface) / <alpha-value>)",
        "zen-subtle": "rgb(var(--zen-color-subtle) / <alpha-value>)",
        "zen-muted": "rgb(var(--zen-color-muted) / <alpha-value>)",
        "zen-border": "rgb(var(--zen-color-border) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--zen-color-primary) / <alpha-value>)",
          hover: "rgb(var(--zen-color-primary-hover) / <alpha-value>)",
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          500: "rgb(var(--zen-color-primary) / <alpha-value>)",
          600: "rgb(var(--zen-color-primary-hover) / <alpha-value>)",
          700: "#be123c",
        },
      },
      fontFamily: {
        sans: ["var(--zen-font-body)"],
        heading: ["var(--font-heading)", "Georgia", "serif"],
        signature: ["var(--font-signature)", "cursive"],
      },
      animation: {
        "hero-img-scroll": "heroImgScroll 25s linear infinite",
        "phone-ring": "phoneRing 1.5s ease-in-out infinite",
        "float-in": "floatIn 3s ease-in-out infinite alternate",
        "slide-in": "slideIn 0.3s ease-out forwards",
      },
      keyframes: {
        heroImgScroll: {
          "0%": { transform: "translateY(0%)" },
          "100%": { transform: "translateY(-50%)" },
        },
        phoneRing: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "10%, 30%, 50%": { transform: "rotate(-15deg)" },
          "20%, 40%": { transform: "rotate(15deg)" },
        },
        floatIn: {
          "0%": { transform: "translateY(0px) scale(1)" },
          "100%": { transform: "translateY(-8px) scale(1.15)" },
        },
        slideIn: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
