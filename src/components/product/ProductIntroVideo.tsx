"use client";

import { cn } from "@/lib/utils";
import { fa } from "@/lib/i18n/fa";

interface ProductIntroVideoProps {
  url: string;
  title: string;
  className?: string;
}

function toYouTubeEmbed(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "").trim();
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v")?.trim();
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

function isDirectVideo(url: string): boolean {
  return /^\/\S+/.test(url) || /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
}

export function ProductIntroVideo({ url, title, className }: ProductIntroVideoProps) {
  const src = url.trim();
  if (!src) return null;

  const youtubeEmbed = toYouTubeEmbed(src);
  const label = fa.product.introVideoTitle;

  return (
    <section className={cn("product-intro-video", className)} aria-label={label}>
      {isDirectVideo(src) ? (
        <video
          className="product-intro-video-element"
          controls
          preload="metadata"
          playsInline
          aria-label={`${label} ${title}`}
        >
          <source src={src} />
        </video>
      ) : (
        <iframe
          className="product-intro-video-embed"
          src={youtubeEmbed ?? src}
          title={`${label} ${title}`}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      )}
    </section>
  );
}
