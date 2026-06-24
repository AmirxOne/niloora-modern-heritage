import { absoluteUrl, getSiteUrl } from "@/lib/seo/site";
import { fa } from "@/lib/i18n/fa";
import type { SiteSocialLinks } from "@/lib/site-settings/types";

type BreadcrumbItem = { name: string; path: string };

export function buildOrganizationJsonLd(input: {
  brandName: string;
  logoUrl: string | null;
  social: SiteSocialLinks;
  contactPhone?: string | null;
}) {
  const sameAs = Object.values(input.social).filter(
    (value): value is string => typeof value === "string" && value.startsWith("http")
  );
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: input.brandName,
    url: getSiteUrl(),
    logo: input.logoUrl ? absoluteUrl(input.logoUrl) : undefined,
    ...(sameAs.length ? { sameAs } : {}),
    ...(input.contactPhone
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            telephone: input.contactPhone,
            contactType: "customer service",
            areaServed: "IR",
            availableLanguage: ["fa"],
          },
        }
      : {}),
  };
}

export function buildWebSiteJsonLd(input: { brandName: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: input.brandName,
    url: getSiteUrl(),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${getSiteUrl()}/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildWebPageJsonLd(input: {
  name: string;
  description: string;
  path: string;
  brandName?: string;
}) {
  const brandName = input.brandName ?? fa.brand.name;
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    isPartOf: {
      "@type": "WebSite",
      name: brandName,
      url: getSiteUrl(),
    },
  };
}

export function buildLocalBusinessJsonLd(input: {
  brandName: string;
  logoUrl: string | null;
  telephone?: string | null;
  address?: string | null;
  openingHours?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "JewelryStore",
    name: input.brandName,
    url: getSiteUrl(),
    image: input.logoUrl ? absoluteUrl(input.logoUrl) : undefined,
    ...(input.telephone ? { telephone: input.telephone } : {}),
    ...(input.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: input.address,
            addressCountry: "IR",
          },
        }
      : {}),
    ...(input.openingHours ? { openingHours: input.openingHours } : {}),
  };
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildFaqJsonLd(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildArticleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  publishedAt: string;
  updatedAt?: string;
  authorName?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    image: input.image ? absoluteUrl(input.image) : undefined,
    datePublished: input.publishedAt,
    dateModified: input.updatedAt ?? input.publishedAt,
    author: input.authorName
      ? { "@type": "Person", name: input.authorName }
      : { "@type": "Organization", name: fa.brand.name },
    publisher: {
      "@type": "Organization",
      name: fa.brand.name,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(input.path),
    },
  };
}
