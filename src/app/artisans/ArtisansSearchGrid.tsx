"use client";

import { useMemo, useState } from "react";
import { ArtisanCard } from "@/components/artisans/ArtisanCard";
import type { ArtisanProfile, ArtisanRole } from "@/lib/artisans";

type ArtisansSearchGridProps = {
  artisans: ArtisanProfile[];
};

type ArtisanRoleFilter = "all" | ArtisanRole;

const ARTISAN_GROUPS: Array<{
  id: ArtisanRoleFilter;
  title: string;
  description: string;
}> = [
  {
    id: "all",
    title: "همه استادان و طراحان",
    description: "نمای کلی تمام نقش‌های هنری و فنی فعال در کاتالوگ",
  },
  {
    id: "shank-designer",
    title: "استادان و طراحان ساخت رکاب",
    description: "طراحی، ساخت، فرم‌دهی و پرداخت بدنه رکاب",
  },
  {
    id: "band-engraver",
    title: "استادان حکاکی و خوشنویسی روی رکاب",
    description: "حکاکی متن، امضا و خوشنویسی روی بدنه رکاب",
  },
  {
    id: "stone-engraver",
    title: "استادان طراحی و حکاکی روی سنگ",
    description: "طراحی، حکاکی و خوشنویسی مستقیم روی سنگ یا نگین",
  },
  {
    id: "carving-master",
    title: "استادان طراحی و قلم‌کاری روی رکاب",
    description: "نقش‌پردازی، قلم‌زنی و تزئینات هنری روی رکاب",
  },
];

function normalizeSearchText(value: string): string {
  return value
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("fa-IR");
}

function getRoleGroup(role: ArtisanRole): (typeof ARTISAN_GROUPS)[number] {
  return ARTISAN_GROUPS.find((group) => group.id === role) ?? ARTISAN_GROUPS[0];
}

export function ArtisansSearchGrid({ artisans }: ArtisansSearchGridProps) {
  const [query, setQuery] = useState("");
  const [activeRole, setActiveRole] = useState<ArtisanRoleFilter>("all");

  const filtered = useMemo(() => {
    const normalized = normalizeSearchText(query);
    return artisans.filter((artisan) => {
      if (activeRole !== "all" && artisan.primaryRole !== activeRole) return false;
      if (!normalized) return true;
      const haystack = [
        artisan.name,
        artisan.title,
        artisan.specialty,
        artisan.bio,
        artisan.location,
        getRoleGroup(artisan.primaryRole).title,
        ...artisan.roleTags,
      ]
        .join(" ")
        .replace(/ي/g, "ی")
        .replace(/ك/g, "ک")
        .toLocaleLowerCase("fa-IR");
      return haystack.includes(normalized);
    });
  }, [activeRole, artisans, query]);

  const roleCounts = useMemo(() => {
    const counts = new Map<ArtisanRoleFilter, number>([["all", artisans.length]]);
    for (const artisan of artisans) {
      counts.set(artisan.primaryRole, (counts.get(artisan.primaryRole) ?? 0) + 1);
    }
    return counts;
  }, [artisans]);

  const grouped = useMemo(
    () =>
      ARTISAN_GROUPS.filter((group) => group.id !== "all")
        .map((group) => ({
          ...group,
          items: filtered.filter((artisan) => artisan.primaryRole === group.id),
        }))
        .filter((group) => group.items.length > 0),
    [filtered]
  );

  return (
    <>
      <div className="artisans-search">
        <div className="artisans-search__field">
          <label htmlFor="artisans-search-input" className="artisans-search__label">
            جستجو در استادان و طراحان
          </label>
          <input
            id="artisans-search-input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="مثلاً محمد اقبال، طراحی رکاب، حکاکی روی سنگ..."
            className="artisans-search__input"
          />
        </div>

        <div className="artisans-role-tabs" role="tablist" aria-label="دسته‌بندی استادان و طراحان">
          {ARTISAN_GROUPS.filter((group) => (roleCounts.get(group.id) ?? 0) > 0).map((group) => (
            <button
              key={group.id}
              type="button"
              role="tab"
              aria-selected={activeRole === group.id}
              className={`artisans-role-tab ${activeRole === group.id ? "artisans-role-tab--active" : ""}`}
              onClick={() => setActiveRole(group.id)}
            >
              <span>{group.title}</span>
              <strong>{(roleCounts.get(group.id) ?? 0).toLocaleString("fa-IR")}</strong>
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="artisans-group-list">
          {activeRole === "all" ? (
            grouped.map((group) => (
              <section key={group.id} className="artisans-group" aria-labelledby={`artisans-group-${group.id}`}>
                <header className="artisans-group__header">
                  <div>
                    <h2 id={`artisans-group-${group.id}`} className="artisans-group__title">
                      {group.title}
                    </h2>
                    <p className="artisans-group__description">{group.description}</p>
                  </div>
                  <span className="artisans-group__count">{group.items.length.toLocaleString("fa-IR")} نفر</span>
                </header>
                <div className="artisans-grid">
                  {group.items.map((artisan) => (
                    <ArtisanCard key={artisan.slug} artisan={artisan} />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="artisans-grid">
              {filtered.map((artisan) => (
                <ArtisanCard key={artisan.slug} artisan={artisan} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="artisan-search-empty">
          <p>استاد یا طراحی با این عبارت پیدا نشد.</p>
          <p>نام استاد یا تخصص را به شکل دیگری جستجو کنید.</p>
        </div>
      )}
    </>
  );
}
