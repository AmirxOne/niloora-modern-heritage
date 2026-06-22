import Image from "next/image";
import Link from "next/link";
import { ARTISAN_ROLE_LABELS, type ArtisanProfile } from "@/lib/artisans";

export function ArtisanCard({ artisan }: { artisan: ArtisanProfile }) {
  return (
    <article className="artisan-card">
      <Link href={`/artisans/${artisan.slug}`} className="artisan-card-link">
        <div className="artisan-card-image">
          <Image
            src={artisan.image}
            alt={artisan.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="artisan-card-image-el"
          />
        </div>
        <div className="artisan-card-body">
          <div className="artisan-card-topline">
            <span className="artisan-card-role">{ARTISAN_ROLE_LABELS[artisan.primaryRole]}</span>
          </div>
          <h2 className="artisan-card-name">{artisan.name}</h2>
          <p className="artisan-card-title">{artisan.title}</p>
          <p className="artisan-card-specialty">{artisan.specialty}</p>
          <div className="artisan-card-tags">
            {artisan.roleTags.slice(0, 3).map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <p className="artisan-card-exp">
            {artisan.yearsExperience.toLocaleString("fa-IR")} سال سابقه
          </p>
        </div>
      </Link>
    </article>
  );
}
