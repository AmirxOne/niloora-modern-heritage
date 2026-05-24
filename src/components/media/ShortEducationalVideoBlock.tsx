import { cn } from "@/lib/utils";

type ShortEducationalVideoBlockProps = {
  url: string;
  title: string;
  caption?: string;
  className?: string;
};

function toEmbedUrl(rawUrl: string): { src: string; kind: "iframe" | "video" } | null {
  const src = rawUrl.trim();
  if (!src) return null;

  if (/^\/\S+/.test(src) || /\.(mp4|webm|ogg)(\?.*)?$/i.test(src)) {
    return { src, kind: "video" };
  }

  try {
    const parsed = new URL(src);
    const host = parsed.hostname.toLowerCase();

    if (host.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "").trim();
      if (!id) return null;
      return { src: `https://www.youtube.com/embed/${id}`, kind: "iframe" };
    }

    if (host.includes("youtube.com")) {
      const id = parsed.searchParams.get("v")?.trim();
      if (!id) return null;
      return { src: `https://www.youtube.com/embed/${id}`, kind: "iframe" };
    }

    if (host.includes("aparat.com")) {
      const match = parsed.pathname.match(/\/v\/([^/?#]+)/i);
      const id = match?.[1]?.trim();
      if (id) {
        return {
          src: `https://www.aparat.com/video/video/embed/videohash/${id}/vt/frame`,
          kind: "iframe",
        };
      }
      if (parsed.pathname.includes("/video/video/embed/videohash/")) {
        return { src, kind: "iframe" };
      }
    }

    if (host.includes("vimeo.com")) {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      if (!id) return null;
      return { src: `https://player.vimeo.com/video/${id}`, kind: "iframe" };
    }
  } catch {
    return null;
  }

  return null;
}

export function ShortEducationalVideoBlock({
  url,
  title,
  caption,
  className,
}: ShortEducationalVideoBlockProps) {
  const resolved = toEmbedUrl(url);
  if (!resolved) return null;

  return (
    <figure className={cn("short-educational-video", className)}>
      <div className="short-educational-video-frame">
        {resolved.kind === "video" ? (
          <video
            className="short-educational-video-element"
            controls
            preload="metadata"
            playsInline
            aria-label={title}
          >
            <source src={resolved.src} />
          </video>
        ) : (
          <iframe
            className="short-educational-video-element"
            src={resolved.src}
            title={title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        )}
      </div>
      {caption ? <figcaption className="short-educational-video-caption">{caption}</figcaption> : null}
    </figure>
  );
}
