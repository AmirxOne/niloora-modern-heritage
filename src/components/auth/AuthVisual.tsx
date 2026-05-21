import Image from "next/image";
import { fa } from "@/lib/i18n/fa";
import { SITE_IMAGE_1 } from "@/lib/images";

export function AuthVisual() {
  return (
    <div className="auth-visual">
      <div className="auth-visual-media" aria-hidden>
        <Image
          src={SITE_IMAGE_1}
          alt=""
          fill
          className="object-cover object-center"
          sizes="(max-width: 1024px) 100vw, 65vw"
          priority
        />
        <div className="auth-visual-scrim" />
      </div>

      <div className="auth-visual-copy">
        <span className="auth-visual-rule" aria-hidden />
        <p className="auth-visual-kicker">{fa.auth.visualKicker}</p>
        <h2 className="auth-visual-title">{fa.auth.visualTitle}</h2>
        <p className="auth-visual-subtitle">{fa.auth.visualSubtitle}</p>
      </div>
    </div>
  );
}
