import type { SiteSocialKey } from "@/lib/site-settings/social";

const sizeDefault = 20;

type Props = {
  brand: SiteSocialKey;
  size?: number;
  className?: string;
};

export function SocialBrandIcon({ brand, size = sizeDefault, className }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    className,
    "aria-hidden": true as const,
  };

  switch (brand) {
    case "instagram":
      return (
        <svg {...common}>
          <rect x="2.5" y="2.5" width="19" height="19" rx="5" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
        </svg>
      );
    case "bale":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" fillOpacity="0.12" />
          <path
            d="M8.2 15.2V8.8h1.55c1.45 0 2.35.78 2.35 2.02 0 .82-.38 1.42-1.02 1.72l1.62 2.66H11.1l-1.42-2.38H9.75v2.38H8.2zm1.55-3.85h.35c.62 0 .95-.32.95-.88 0-.55-.33-.86-.95-.86H9.75v1.74zM14.1 15.2l2.35-6.4h1.65l-2.35 6.4h-1.65z"
            fill="currentColor"
          />
        </svg>
      );
    case "eita":
      return (
        <svg {...common}>
          <path
            d="M12 3c4.2 0 7.5 2.9 7.5 6.5 0 2.1-1.1 3.9-2.9 5l1.4 4.5-4.8-2.6c-.5.08-1 .12-1.5.12-4.2 0-7.5-2.9-7.5-6.5S7.8 3 12 3z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <circle cx="9.2" cy="9.8" r="1" fill="currentColor" />
          <circle cx="12" cy="9.8" r="1" fill="currentColor" />
          <circle cx="14.8" cy="9.8" r="1" fill="currentColor" />
        </svg>
      );
    case "telegram":
      return (
        <svg {...common}>
          <path
            d="M20.5 4.5 4.2 11.2c-.9.35-.88 1.62.03 1.94l4.1 1.28 1.58 4.78c.28.84 1.42.98 1.9.24l2.2-3.17 4.55 3.35c.72.53 1.74.12 1.92-.72L21.8 5.7c.2-.88-.62-1.58-1.3-1.2z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="m9.2 13.3 7.9-5.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg {...common}>
          <path
            d="M12 3a8.5 8.5 0 0 0-7.3 12.7L3 21l5.5-1.6A8.5 8.5 0 1 0 12 3z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M9.2 9.4c.2-.45.42-.46.68-.46.18 0 .37 0 .53.02.15.01.35-.06.54.41.18.45.62 1.52.67 1.63.05.11.08.24-.01.38-.08.13-.12.22-.25.34-.12.12-.26.27-.37.36-.12.1-.25.21-.11.42.14.2.61.98 1.3 1.58.9.78 1.66 1.03 1.9 1.15.24.11.38.1.52-.06.14-.16.6-.68.76-.92.16-.24.32-.2.54-.12.22.08 1.4.64 1.64.76.24.12.4.18.46.28.06.1.06.58-.14 1.14-.2.56-.92 1.08-1.28 1.15-.34.07-.78.11-1.12-.05-.52-.23-1.22-.45-2.12-1.4-.78-.82-1.3-1.84-1.45-2.15-.14-.31-.01-.48.11-.63.11-.14.24-.36.36-.54.12-.18.16-.3.24-.48.08-.18.04-.34-.02-.48-.06-.14-.52-1.22-.72-1.67z"
            fill="currentColor"
          />
        </svg>
      );
    case "twitter":
      return (
        <svg {...common}>
          <path
            d="M4 4.5 10.2 13.4 4 19.5h2.2l4.8-5.1 3.9 5.1H20l-6.5-7.6L19.4 4.5h-2.2l-4.4 4.7L9.4 4.5H4z"
            fill="currentColor"
          />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common}>
          <rect x="3" y="6.5" width="18" height="11" rx="3" stroke="currentColor" strokeWidth="1.6" />
          <path d="m10 9.5 5.5 3L10 15.5V9.5z" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
}
