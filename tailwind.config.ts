import type { Config } from "tailwindcss";
const { fontFamily } = require("tailwindcss/defaultTheme");

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: "#2C2A29",
          dark: "#1A1817",
          light: "#4A4640",
        },
        gold: {
          DEFAULT: "#B8860B",
          light: "#C5A059",
          dark: "#8B6914",
        },
        turquoise: {
          DEFAULT: "#1A7569",
          light: "#2A9D8F",
          dark: "#0F5249",
        },
        royal: {
          DEFAULT: "#E8EDE8",
          light: "#F4F7F4",
          dark: "#2C4A5E",
        },
        matte: {
          DEFAULT: "#FFFFFF",
          elevated: "#FFFFFF",
          surface: "#F5F3EF",
        },
        silver: {
          DEFAULT: "#78716C",
          light: "#A8A29E",
        },
        parchment: {
          DEFAULT: "#F5F3EF",
          dark: "#EAE6E0",
        },
        danger: {
          DEFAULT: "#6B2D2D",
          light: "#9B4040",
          bg: "#FDF0F0",
        },
        bahakahi: {
          DEFAULT: "#b91c1c",
          bg: "#fff0f0",
        },
        price: {
          sale: "#2f2a24",
        },
        lapis: {
          DEFAULT: "#2C4A5E",
          light: "#3D6280",
        },
        /** راستهٔ بازار — آجر، مه، سایهٔ راهرو */
        bazaar: {
          lane: "#EDE6DB",
          arch: "#E2D8C8",
          mist: "#F6F1EA",
          deep: "#2C2622",
        },
        /** لبهٔ مسی حجره — کنار طلای گرما */
        copper: {
          DEFAULT: "#9E6B43",
          light: "#C4956A",
          dark: "#6B4528",
        },
      },
      fontFamily: {
        IranYekanFont: ["var(--font-iranYekanFont)", ...fontFamily.sans],
        IranYekanFontNum: ["var(--font-iranYekanFontNum)", ...fontFamily.sans],
        display: ["var(--font-iranYekanFontNum)", "Tahoma", "sans-serif"],
        body: ["var(--font-iranYekanFontNum)", "Tahoma", "sans-serif"],
        persian: ["var(--font-iranYekanFontNum)", "Tahoma", "sans-serif"],
        latin: ["var(--font-display-latin)", "Georgia", "serif"],
      },
      width: {
        "control-sm": "2.25rem",
        control: "2.75rem",
        "control-lg": "3rem",
      },
      height: {
        "control-sm": "2.25rem",
        control: "2.75rem",
        "control-lg": "3rem",
      },
      minHeight: {
        "control-sm": "2.25rem",
        control: "2.75rem",
        "control-lg": "3rem",
      },
      minWidth: {
        "control-sm": "2.25rem",
        control: "2.75rem",
        "control-lg": "3rem",
      },
      borderRadius: {
        /** 10px — شعاع یکتا برای کل پروژه */
        heritage: "0.625rem",
        /** aliases (backward-compat): unified with heritage */
        "heritage-lg": "0.625rem",
        "heritage-xl": "0.625rem",
        "heritage-pill": "0.625rem",
      },
      letterSpacing: {
        heritage: "0.2em",
        wide: "0.12em",
      },
      backgroundImage: {
        "heritage-gradient":
          "linear-gradient(165deg, #FFFFFF 0%, #F5F3EF 38%, #EAF0EE 72%, #F5F3EF 100%)",
        "heritage-radial":
          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(184,134,11,0.07) 0%, transparent 55%)",
        "gold-shimmer":
          "linear-gradient(270deg, transparent, rgba(184,134,11,0.12), transparent)",
        "cinematic-radial":
          "radial-gradient(ellipse at center, rgba(26,117,105,0.07) 0%, transparent 68%)",
        "royal-gradient":
          "linear-gradient(165deg, #F4F7F4 0%, #E8F0EE 50%, #F8F5EF 100%)",
        /** نور گنبد + راستهٔ گرم */
        "bazaar-dawn":
          "radial-gradient(ellipse 100% 70% at 50% -8%, rgba(26,117,105,0.09) 0%, transparent 52%), radial-gradient(ellipse 70% 55% at 100% 0%, rgba(166,124,61,0.11) 0%, transparent 48%), linear-gradient(185deg, #FFFCF7 0%, #F1E8DC 38%, #F8F5EF 100%)",
        "niche-glow":
          "radial-gradient(ellipse 55% 45% at 85% 12%, rgba(26,117,105,0.11) 0%, transparent 55%)",
      },
      boxShadow: {
        luxury: "0 20px 50px -16px rgba(44, 42, 41, 0.10)",
        "luxury-gold": "0 8px 32px rgba(184, 134, 11, 0.20)",
        heritage: "0 4px 24px rgba(44, 42, 41, 0.06), 0 0 0 1px rgba(184, 134, 11, 0.10)",
        "heritage-hover":
          "0 28px 56px -20px rgba(44, 42, 41, 0.14), 0 0 0 1px rgba(184, 134, 11, 0.18)",
        glass: "0 8px 32px rgba(44, 42, 41, 0.06)",
        insetGold: "inset 0 1px 0 rgba(255,255,255,0.7)",
        /** قاب کارت */
        hojreh:
          "0 1px 0 rgba(255,255,255,0.8) inset, 0 4px 16px -4px rgba(44,42,41,0.08), 0 0 0 1px rgba(240,237,233,1)",
        "hojreh-hover":
          "0 1px 0 rgba(255,255,255,0.9) inset, 0 8px 24px -8px rgba(44,42,41,0.12), 0 0 0 1px rgba(184,134,11,0.18)",
      },
      maxWidth: {
        site: "1636px",
      },
      animation: {
        shimmer: "shimmer 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
