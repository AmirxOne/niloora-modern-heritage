import type { EngravingMasterId, Product, ShankMasterId } from "@/lib/types";
import {
  ENGRAVING_MASTERS,
  SHANK_MASTERS,
  getEngravingMaster,
  getShankMaster,
} from "@/lib/customizer/catalog";
import { pickSiteImageByKey, pickTestArtisanImageByKey } from "@/lib/images";

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

type DerivedArtisanRole = "shank-designer" | "band-engraver";

export const ARTISAN_ROLE_LABELS: Record<ArtisanRole, string> = {
  "shank-designer": "استادان و طراحان ساخت رکاب",
  "carving-master": "استادان طراحی و قلم‌کاری روی رکاب",
  "band-engraver": "استادان حکاکی و خوشنویسی روی رکاب",
  "stone-engraver": "استادان طراحی و حکاکی روی سنگ",
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function slugifyFa(input: string): string {
  const latin = slugify(input);
  if (latin) return latin;
  const normalized = normalizeFaText(input).replace(/\s+/g, "-");
  return normalized ? `artisan-${normalized}` : "artisan-unknown";
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
    specialty: "طراحی، ساخت و پرداخت بدنه رکاب",
    bio: m.description,
    image: m.image || pickSiteImageByKey(slug),
    yearsExperience: m.id === "ebrahim-azari" ? 28 : m.id === "tehrani-azari" ? 19 : 24,
    location: "تهران، کارگاه نیلورا",
    roleTags: ["طراحی رکاب", "ساخت رکاب", "پرداخت فلز"],
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
    specialty:
      m.scope === "stone"
        ? "طراحی، حکاکی و خوشنویسی روی سنگ"
        : "طراحی، قلم‌کاری و خوشنویسی روی رکاب",
    bio: m.description,
    image: m.image || pickSiteImageByKey(slug, 1),
    yearsExperience:
      m.id === "kourosh" ? 22 : m.id === "naderi" ? 18 : m.id === "rahimi" ? 17 : m.id === "lotif" ? 21 : 16,
    location: "کارگاه‌های همکار نیلورا",
    roleTags:
      m.scope === "stone"
        ? ["طراحی روی سنگ", "حکاکی سنگ", "خط سنتی"]
        : ["طراحی روی رکاب", "قلم‌کاری رکاب", "خوشنویسی رکاب"],
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

function deriveArtisanProfile(name: string, role: DerivedArtisanRole): ArtisanProfile {
  return {
    id: `artisan-derived-${slugifyFa(name)}`,
    slug: slugifyFa(name),
    name,
    title: role === "shank-designer" ? "طراح ساخت رکاب" : "استاد حکاکی روی رکاب",
    specialty: role === "shank-designer" ? "ساخت، فرم‌دهی و پرداخت رکاب" : "حکاکی و خوشنویسی روی رکاب",
    bio:
      role === "shank-designer"
        ? `«${name}» در محصولات کاتالوگ به‌عنوان سازنده و طراح رکاب معرفی شده است.`
        : `«${name}» در محصولات کاتالوگ به‌عنوان استاد حکاکی رکاب معرفی شده است.`,
    image: pickTestArtisanImageByKey(slugifyFa(name)),
    yearsExperience: 12,
    location: "کارگاه همکار",
    roleTags: role === "shank-designer" ? ["ساخت رکاب", "طراحی رکاب"] : ["حکاکی رکاب", "خوشنویسی رکاب"],
    primaryRole: role,
  };
}

function extractArtisanNamesFromDetails(product: Product): Array<{ name: string; role: DerivedArtisanRole }> {
  const details = product.listing?.details ?? [];
  const rows: Array<{ name: string; role: DerivedArtisanRole }> = [];

  for (const detail of details) {
    const line = detail.trim();
    const shankMatch = line.match(/^رکاب\s*:\s*(.+)$/);
    if (shankMatch) {
      const name = shankMatch[1]?.trim();
      if (name) rows.push({ name, role: "shank-designer" });
    }
    const engraverMatch = line.match(/^حکاک\s*:\s*(.+)$/);
    if (engraverMatch) {
      const name = engraverMatch[1]?.trim();
      if (name) rows.push({ name, role: "band-engraver" });
    }
  }

  if (product.craftedBy?.trim()) {
    rows.push({ name: product.craftedBy.trim(), role: "shank-designer" });
  }

  return rows;
}

export function listArtisansForCatalog(products: Product[]): ArtisanProfile[] {
  const base = listAllArtisans();
  const bySlug = new Map(base.map((artisan) => [artisan.slug, artisan]));

  for (const product of products) {
    const extracted = extractArtisanNamesFromDetails(product);
    for (const item of extracted) {
      const existing = getArtisanByName(item.name);
      if (existing) {
        bySlug.set(existing.slug, existing);
        continue;
      }
      const derived = deriveArtisanProfile(item.name, item.role);
      bySlug.set(derived.slug, derived);
    }
  }

  return Array.from(bySlug.values()).sort((a, b) => a.name.localeCompare(b.name, "fa"));
}

export function getArtisanBySlugForCatalog(slug: string, products: Product[]): ArtisanProfile | null {
  return listArtisansForCatalog(products).find((artisan) => artisan.slug === slug) ?? null;
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
  if (!shankDesignerId && product.craftedBy?.trim()) {
    const existing = getArtisanByName(product.craftedBy.trim());
    const artisan = existing ?? deriveArtisanProfile(product.craftedBy.trim(), "shank-designer");
    links.push({
      role: "shank-designer",
      roleLabel: ARTISAN_ROLE_LABELS["shank-designer"],
      artisan,
    });
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
  if (!bandEngraverId) {
    const engraverLine = (product.listing?.details ?? []).find((line) => /^حکاک\s*:/.test(line.trim()));
    const engraverName = engraverLine?.replace(/^حکاک\s*:\s*/, "").trim();
    if (engraverName) {
      const existing = getArtisanByName(engraverName);
      const artisan = existing ?? deriveArtisanProfile(engraverName, "band-engraver");
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

