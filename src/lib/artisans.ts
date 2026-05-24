import type { EngravingMasterId, Product, ShankMasterId } from "@/lib/types";
import {
  ENGRAVING_MASTERS,
  SHANK_MASTERS,
  getEngravingMaster,
  getShankMaster,
} from "@/lib/customizer/catalog";
import { pickSiteImageByKey } from "@/lib/images";

export type ArtisanRole =
  | "shank-designer"
  | "carving-master"
  | "band-engraver"
  | "stone-engraver";

export interface ArtisanProfile {
  id: string;
  slug: string;
  name: string;
  title: string;
  specialty: string;
  bio: string;
  image: string;
  yearsExperience: number;
  location: string;
  roleTags: string[];
  primaryRole: ArtisanRole;
  legacyMasterId?: ShankMasterId | EngravingMasterId;
}

export interface ProductArtisanLink {
  role: ArtisanRole;
  roleLabel: string;
  artisan: ArtisanProfile;
}

const ARTISAN_ROLE_LABELS: Record<ArtisanRole, string> = {
  "shank-designer": "طراح رکاب",
  "carving-master": "استاد قلم‌کاری",
  "band-engraver": "خوشنویس رکاب",
  "stone-engraver": "حکاکی نگین",
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function fromShankMaster(masterId: ShankMasterId): ArtisanProfile | null {
  const m = getShankMaster(masterId);
  if (!m) return null;
  const slug = slugify(m.id);
  return {
    id: `artisan-${m.id}`,
    slug,
    name: m.name,
    title: m.title,
    specialty: "طراحی رکاب و ساخت بدنه انگشتر",
    bio: m.description,
    image: m.image || pickSiteImageByKey(slug),
    yearsExperience: m.id === "ebrahim-azari" ? 28 : m.id === "tehrani-azari" ? 19 : 24,
    location: "تهران، کارگاه نیلورا",
    roleTags: ["طراحی رکاب", "ساخت دستی", "پرداخت فلز"],
    primaryRole: "shank-designer",
    legacyMasterId: m.id,
  };
}

function fromEngraver(masterId: EngravingMasterId): ArtisanProfile | null {
  const m = getEngravingMaster(masterId);
  if (!m) return null;
  const slug = slugify(m.id);
  return {
    id: `artisan-${m.id}`,
    slug,
    name: m.name,
    title: m.specialty,
    specialty: m.scope === "stone" ? "حکاکی و خوشنویسی روی نگین" : "قلم‌زنی و خوشنویسی روی رکاب",
    bio: m.description,
    image: m.image || pickSiteImageByKey(slug, 1),
    yearsExperience:
      m.id === "kourosh" ? 22 : m.id === "naderi" ? 18 : m.id === "rahimi" ? 17 : m.id === "lotif" ? 21 : 16,
    location: "کارگاه‌های همکار نیلورا",
    roleTags:
      m.scope === "stone"
        ? ["حکاکی نگین", "خط سنتی", "جزئیات میکرونی"]
        : ["قلم‌کاری رکاب", "خوشنویسی", "نقش برجسته"],
    primaryRole: m.scope === "stone" ? "stone-engraver" : "band-engraver",
    legacyMasterId: m.id,
  };
}

function uniqueBySlug(list: ArtisanProfile[]): ArtisanProfile[] {
  const map = new Map<string, ArtisanProfile>();
  for (const item of list) {
    if (!map.has(item.slug)) map.set(item.slug, item);
  }
  return Array.from(map.values());
}

export function listAllArtisans(): ArtisanProfile[] {
  const shankProfiles = SHANK_MASTERS.map((m) => fromShankMaster(m.id)).filter(
    (v): v is ArtisanProfile => Boolean(v)
  );
  const engravingProfiles = ENGRAVING_MASTERS.map((m) => fromEngraver(m.id)).filter(
    (v): v is ArtisanProfile => Boolean(v)
  );
  return uniqueBySlug([...shankProfiles, ...engravingProfiles]).sort((a, b) => a.name.localeCompare(b.name, "fa"));
}

export function getArtisanBySlug(slug: string): ArtisanProfile | null {
  return listAllArtisans().find((a) => a.slug === slug) ?? null;
}

function normalizeFaText(value: string): string {
  return value
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("fa-IR");
}

export function getArtisanByName(name: string): ArtisanProfile | null {
  const normalized = normalizeFaText(name);
  if (!normalized) return null;
  const artisans = listAllArtisans();
  return (
    artisans.find((artisan) => normalizeFaText(artisan.name) === normalized) ??
    artisans.find((artisan) => normalized.includes(normalizeFaText(artisan.name))) ??
    artisans.find((artisan) => normalizeFaText(artisan.name).includes(normalized)) ??
    null
  );
}

export function getProductArtisanLinks(product: Product): ProductArtisanLink[] {
  const links: ProductArtisanLink[] = [];
  const assignments = product.artisanAssignments;

  const shankDesignerId =
    assignments?.shankDesignerId ??
    (product.craftedBy?.includes("ابراهیم")
      ? "ebrahim-azari"
      : product.craftedBy?.includes("تهرانی")
      ? "tehrani-azari"
      : undefined);

  if (shankDesignerId) {
    const artisan = fromShankMaster(shankDesignerId);
    if (artisan) {
      links.push({
        role: "shank-designer",
        roleLabel: ARTISAN_ROLE_LABELS["shank-designer"],
        artisan,
      });
    }
  }

  const carvingId = assignments?.carvingMasterId;
  if (carvingId) {
    const artisan = fromEngraver(carvingId);
    if (artisan) {
      links.push({
        role: "carving-master",
        roleLabel: ARTISAN_ROLE_LABELS["carving-master"],
        artisan,
      });
    }
  }

  const bandEngraverId = assignments?.bandEngraverId;
  if (bandEngraverId) {
    const artisan = fromEngraver(bandEngraverId);
    if (artisan) {
      links.push({
        role: "band-engraver",
        roleLabel: ARTISAN_ROLE_LABELS["band-engraver"],
        artisan,
      });
    }
  }

  const stoneEngraverId = assignments?.stoneEngraverId;
  if (stoneEngraverId) {
    const artisan = fromEngraver(stoneEngraverId);
    if (artisan) {
      links.push({
        role: "stone-engraver",
        roleLabel: ARTISAN_ROLE_LABELS["stone-engraver"],
        artisan,
      });
    }
  }

  return links;
}

