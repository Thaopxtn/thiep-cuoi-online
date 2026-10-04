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
        "zen-primary": "#e54153",
        "zen-primary-hover": "#d93849",
        "zen-black": "#1c171a",
        primary: {
          DEFAULT: "#e54153",
          hover: "#d93849",
          50: "#fff1f2",
          100: "#ffe4e6",
          500: "#e54153",
          600: "#d93849",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
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
