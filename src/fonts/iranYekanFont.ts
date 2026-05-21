import localFont from "next/font/local";

const iranYekanFont = localFont({
  src: [
    { path: "../../public/fonts/iranYekanFont/woff/IRANYekanWebThin.woff", weight: "100", style: "normal" },
    { path: "../../public/fonts/iranYekanFont/ttf/IRANYekanWebThin.ttf", weight: "100", style: "normal" },
    { path: "../../public/fonts/iranYekanFont/woff/IRANYekanWebLight.woff", weight: "300", style: "normal" },
    { path: "../../public/fonts/iranYekanFont/ttf/IRANYekanWebLight.ttf", weight: "300", style: "normal" },
    { path: "../../public/fonts/iranYekanFont/woff/IRANYekanWebRegular.woff", weight: "400", style: "normal" },
    { path: "../../public/fonts/iranYekanFont/ttf/IRANYekanWebRegular.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/iranYekanFont/woff/IRANYekanWebMedium.woff", weight: "500", style: "normal" },
    { path: "../../public/fonts/iranYekanFont/ttf/IRANYekanWebMedium.ttf", weight: "500", style: "normal" },
    { path: "../../public/fonts/iranYekanFont/woff/IRANYekanWebBold.woff", weight: "700", style: "normal" },
    { path: "../../public/fonts/iranYekanFont/ttf/IRANYekanWebBold.ttf", weight: "700", style: "normal" },
    { path: "../../public/fonts/iranYekanFont/woff/IRANYekanWebExtraBold.woff", weight: "800", style: "normal" },
    { path: "../../public/fonts/iranYekanFont/ttf/IRANYekanWebExtraBold.ttf", weight: "800", style: "normal" },
    { path: "../../public/fonts/iranYekanFont/woff/IRANYekanWebBlack.woff", weight: "900", style: "normal" },
    { path: "../../public/fonts/iranYekanFont/ttf/IRANYekanWebBlack.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-iranYekanFont",
  style: "normal",
  display: "block",
});

export default iranYekanFont;
