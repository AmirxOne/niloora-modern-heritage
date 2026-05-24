import { ShortEducationalVideoBlock } from "@/components/media/ShortEducationalVideoBlock";

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-ivory">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function parseVideoBlock(block: string): { url: string; caption?: string } | null {
  const trimmed = block.trim();
  const match = trimmed.match(/^\[video\s+url="([^"]+)"(?:\s+caption="([^"]*)")?\]$/i);
  if (!match) return null;
  const url = (match[1] ?? "").trim();
  const caption = (match[2] ?? "").trim();
  if (!url) return null;
  return { url, caption: caption || undefined };
}

export function PostBody({ body }: { body: string }) {
  const blocks = body.split(/\n\n+/).filter(Boolean);

  return (
    <div className="blog-post-body">
      {blocks.map((block, index) => {
        const trimmed = block.trim();
        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={index} className="blog-post-h2">
              {trimmed.slice(3)}
            </h2>
          );
        }
        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={index} className="blog-post-h3">
              {trimmed.slice(4)}
            </h3>
          );
        }
        const video = parseVideoBlock(trimmed);
        if (video) {
          return (
            <ShortEducationalVideoBlock
              key={index}
              url={video.url}
              title="ویدیوی آموزشی مقاله"
              caption={video.caption ?? "ویدیوی کوتاه آموزشی"}
              className="blog-short-video"
            />
          );
        }
        return (
          <p key={index} className="blog-post-paragraph">
            {renderInline(trimmed.replace(/\n/g, " "))}
          </p>
        );
      })}
    </div>
  );
}
