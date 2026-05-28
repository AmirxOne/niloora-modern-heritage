"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { StoneGuideProfile } from "@/lib/stones";

type StonesSearchGridProps = {
  stones: StoneGuideProfile[];
};

function normalizeSearchText(value: string): string {
  return value
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("fa-IR");
}

export function StonesSearchGrid({ stones }: StonesSearchGridProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = normalizeSearchText(query);
    if (!normalized) return stones;
    return stones.filter((stone) => {
      const searchable = [
        stone.name,
        stone.shortTagline,
        stone.scientificFamily,
        stone.historicalOrigin,
        ...stone.searchTags,
      ]
        .join(" ")
        .replace(/ي/g, "ی")
        .replace(/ك/g, "ک")
        .toLocaleLowerCase("fa-IR");
      return searchable.includes(normalized);
    });
  }, [stones, query]);

  return (
    <>
      <div className="stones-search">
        <label htmlFor="stones-search-input" className="stones-search__label">
          جستجو در سنگ‌ها
        </label>
        <input
          id="stones-search-input"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="مثلاً زبرجد، عقیق، یشم، الماس..."
          className="stones-search__input"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="stones-grid">
          {filtered.map((stone) => (
            <article key={stone.slug} className="stone-card">
              <Link href={`/stones/${stone.slug}`} className="stone-card-link">
                <div className="stone-card-image-wrap">
                  <Image
                    src={stone.image}
                    alt={stone.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="stone-card-image"
                  />
                </div>
                <h2 className="stone-card-title">{stone.name}</h2>
                <p className="stone-card-tagline">{stone.shortTagline}</p>
                <p className="stone-card-meta">
                  نخستین کاربرد شاخص: <strong>{stone.firstMajorUsePeriod}</strong>
                </p>
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="stone-search-empty">
          <p>سنگی با این عبارت پیدا نشد.</p>
          <p>عبارت دیگری مثل نام فارسی/انگلیسی سنگ را امتحان کنید.</p>
        </div>
      )}
    </>
  );
}
