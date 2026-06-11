#!/usr/bin/env node
/**
 * One-off, idempotent image optimizer for the `public/images` tree.
 *
 * What it does:
 *   1. Recompresses every JPG/JPEG (quality ~80, max width 1600px, mozjpeg).
 *      The file is only overwritten when the result is actually smaller.
 *   2. Converts the three heavy ring-carving PNGs in `public/images/customize`
 *      to WebP and rewrites their references in `src/lib/images.ts`, then
 *      removes the original PNG once the WebP exists and references are updated.
 *
 * It is safe to run multiple times: already-optimised JPGs are skipped when no
 * size win is possible, and PNGs that were already converted are ignored.
 *
 * Usage:
 *   node scripts/optimize-images.mjs            # optimise everything
 *   node scripts/optimize-images.mjs --dry-run  # report only, no writes
 */

import { readdir, readFile, writeFile, stat, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const IMAGES_DIR = path.join(ROOT, "public", "images");
const IMAGES_TS = path.join(ROOT, "src", "lib", "images.ts");

const DRY_RUN = process.argv.includes("--dry-run");
const MAX_WIDTH = 1600;
const JPEG_QUALITY = 80;
const WEBP_QUALITY = 82;

const HEAVY_PNGS = [
  "customize/shank-carving-pattern-floral.png",
  "customize/shank-carving-pattern-geometric.png",
  "customize/shank-carving-pattern-heritage.png",
];

let totalBefore = 0;
let totalAfter = 0;
let jpgChanged = 0;
let pngConverted = 0;

function fmtKB(bytes) {
  return `${(bytes / 1024).toFixed(0)}KB`;
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else {
      files.push(full);
    }
  }
  return files;
}

async function recompressJpg(file) {
  const original = await readFile(file);
  const meta = await sharp(original).metadata();
  let pipeline = sharp(original).rotate();
  if (meta.width && meta.width > MAX_WIDTH) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  }
  const optimized = await pipeline
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true, progressive: true })
    .toBuffer();

  totalBefore += original.length;

  if (optimized.length < original.length) {
    totalAfter += optimized.length;
    jpgChanged += 1;
    const rel = path.relative(ROOT, file);
    console.log(
      `  jpg  ${rel}  ${fmtKB(original.length)} -> ${fmtKB(optimized.length)}`
    );
    if (!DRY_RUN) await writeFile(file, optimized);
  } else {
    totalAfter += original.length;
  }
}

async function convertHeavyPngs() {
  let imagesTs = await readFile(IMAGES_TS, "utf8");
  let tsChanged = false;

  for (const rel of HEAVY_PNGS) {
    const pngPath = path.join(IMAGES_DIR, rel);
    const webpPath = pngPath.replace(/\.png$/i, ".webp");
    const webpRel = `/images/${rel.replace(/\.png$/i, ".webp")}`;

    if (!existsSync(pngPath)) {
      continue; // already converted on a previous run
    }

    const original = await readFile(pngPath);
    const webp = await sharp(original)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    totalBefore += original.length;
    totalAfter += webp.length;
    pngConverted += 1;
    console.log(
      `  png  ${path.relative(ROOT, pngPath)}  ${fmtKB(original.length)} -> ${fmtKB(
        webp.length
      )} (webp)`
    );

    const pngRef = `/images/${rel}`;
    if (imagesTs.includes(pngRef)) {
      imagesTs = imagesTs.split(pngRef).join(webpRel);
      tsChanged = true;
    }

    if (!DRY_RUN) {
      await writeFile(webpPath, webp);
    }
  }

  if (tsChanged && !DRY_RUN) {
    await writeFile(IMAGES_TS, imagesTs);
    console.log("  updated src/lib/images.ts PNG references -> .webp");
  }

  // Remove the originals only after references are rewritten so re-runs are safe.
  if (!DRY_RUN) {
    for (const rel of HEAVY_PNGS) {
      const pngPath = path.join(IMAGES_DIR, rel);
      if (existsSync(pngPath) && !imagesTs.includes(`/images/${rel}`)) {
        await rm(pngPath);
      }
    }
  }
}

async function main() {
  if (!existsSync(IMAGES_DIR)) {
    console.error(`Image directory not found: ${IMAGES_DIR}`);
    process.exit(1);
  }
  console.log(`${DRY_RUN ? "[dry-run] " : ""}Optimising images under public/images ...\n`);

  const files = await walk(IMAGES_DIR);
  for (const file of files) {
    if (/\.(jpe?g)$/i.test(file)) {
      try {
        await recompressJpg(file);
      } catch (err) {
        console.warn(`  ! skipped ${path.relative(ROOT, file)}: ${err.message}`);
      }
    }
  }

  await convertHeavyPngs();

  console.log("\nSummary");
  console.log(`  JPGs recompressed: ${jpgChanged}`);
  console.log(`  PNGs -> WebP:      ${pngConverted}`);
  console.log(
    `  Total: ${fmtKB(totalBefore)} -> ${fmtKB(totalAfter)} (saved ${fmtKB(
      Math.max(0, totalBefore - totalAfter)
    )})`
  );
  if (DRY_RUN) console.log("\n(dry-run: no files were written)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
