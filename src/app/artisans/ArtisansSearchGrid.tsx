"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { ArtisanProfile } from "@/lib/artisans";

type ArtisansSearchGridProps = {
  artisans: ArtisanProfile[];
};

export function ArtisansSearchGrid({ artisans }: ArtisansSearchGridProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fa-IR");
    if (!normalized) return artisans;
    return artisans.filter((artisan) => {
      const haystack = [
        artisan.name,
        artisan.title,
        artisan.specialty,
        artisan.bio,
        artisan.location,
        ...artisan.roleTags,
      ]
        .join(" ")
        .toLocaleLowerCase("fa-IR");
      return haystack.includes(normalized);
    });
  }, [artisans, query]);

  return (
    <>
      <div className="artisans-search">
        <label htmlFor="artisans-search-input" className="artisans-search__label">
          جستجو در استادکاران
        </label>
        <input
          id="artisans-search-input"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="مثلاً ابراهیم، حکاکی نگین، قلم‌کاری..."
          className="artisans-search__input"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="artisans-grid">
          {filtered.map((artisan) => (
            <article key={artisan.slug} className="artisan-card">
              <Link href={`/artisans/${artisan.slug}`} className="artisan-card-link">
                <div className="artisan-card-image">
                  <Image
                    src={artisan.image}
                    alt={artisan.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="artisan-card-image-el"
                  />
                </div>
                <div className="artisan-card-body">
                  <h2 className="artisan-card-name">{artisan.name}</h2>
                  <p className="artisan-card-title">{artisan.title}</p>
                  <p className="artisan-card-specialty">{artisan.specialty}</p>
                  <p className="artisan-card-exp">{artisan.yearsExperience.toLocaleString("fa-IR")} سال سابقه</p>
                </div>
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="artisan-search-empty">
          <p>استادکاری با این عبارت پیدا نشد.</p>
          <p>نام استاد یا تخصص را به شکل دیگری جستجو کنید.</p>
        </div>
      )}
    </>
  );
}
