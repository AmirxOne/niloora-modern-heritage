import localFont from "next/font/local";

const iranYekanFontNum = localFont({
  src: [
    { path: "../../public/fonts/iranYekanFontNum/woff/iranyekanwebthinfanum.woff", weight: "100", style: "normal" },
    { path: "../../public/fonts/iranYekanFontNum/ttf/iranyekanwebthinfanum.ttf", weight: "100", style: "normal" },
    { path: "../../public/fonts/iranYekanFontNum/woff/iranyekanweblightfanum.woff", weight: "300", style: "normal" },
    { path: "../../public/fonts/iranYekanFontNum/ttf/iranyekanweblightfanum.ttf", weight: "300", style: "normal" },
    { path: "../../public/fonts/iranYekanFontNum/woff/iranyekanwebregularfanum.woff", weight: "400", style: "normal" },
    { path: "../../public/fonts/iranYekanFontNum/ttf/iranyekanwebregularfanum.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/iranYekanFontNum/woff/iranyekanwebmediumfanum.woff", weight: "500", style: "normal" },
    { path: "../../public/fonts/iranYekanFontNum/ttf/iranyekanwebmediumfanum.ttf", weight: "500", style: "normal" },
    { path: "../../public/fonts/iranYekanFontNum/woff/iranyekanwebboldfanum.woff", weight: "700", style: "normal" },
    { path: "../../public/fonts/iranYekanFontNum/ttf/iranyekanwebboldfanum.ttf", weight: "700", style: "normal" },
    { path: "../../public/fonts/iranYekanFontNum/woff/iranyekanwebextraboldfanum.woff", weight: "800", style: "normal" },
    { path: "../../public/fonts/iranYekanFontNum/ttf/iranyekanwebextraboldfanum.ttf", weight: "800", style: "normal" },
    { path: "../../public/fonts/iranYekanFontNum/woff/iranyekanwebblackfanum.woff", weight: "900", style: "normal" },
    { path: "../../public/fonts/iranYekanFontNum/ttf/iranyekanwebblackfanum.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-iranYekanFontNum",
  style: "normal",
  display: "block",
});

export default iranYekanFontNum;
