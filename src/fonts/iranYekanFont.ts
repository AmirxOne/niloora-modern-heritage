import localFont from "next/font/local";

const iranYekanFont = localFont({
  src: [
    { path: "../../public/fonts/iranYekanFont/woff/IRANYekanWebLight.woff", weight: "300", style: "normal" },
    { path: "../../public/fonts/iranYekanFont/woff/IRANYekanWebRegular.woff", weight: "400", style: "normal" },
    { path: "../../public/fonts/iranYekanFont/woff/IRANYekanWebMedium.woff", weight: "500", style: "normal" },
    { path: "../../public/fonts/iranYekanFont/woff/IRANYekanWebBold.woff", weight: "700", style: "normal" },
    { path: "../../public/fonts/iranYekanFont/woff/IRANYekanWebExtraBold.woff", weight: "800", style: "normal" },
    { path: "../../public/fonts/iranYekanFont/woff/IRANYekanWebBlack.woff", weight: "900", style: "normal" },
  ],
  variable: "--font-iranYekanFont",
  style: "normal",
  display: "swap",
});

export default iranYekanFont;
