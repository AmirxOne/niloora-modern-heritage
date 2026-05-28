"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Check, Copy } from "@/components/icons";
import { fa } from "@/lib/i18n/fa";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";
import {
  buildGuideSearchParams,
  parseGuideAnswers,
  resolveGuideRecommendation,
  type GuideAnswers,
} from "@/lib/guide/interactive-buying-guide";
import { STONE_OPTIONS } from "@/lib/constants";
import { budgetFilterOptions, styleFilterOptions } from "@/lib/shop-filter-utils";

type Option<T extends string> = { value: T; label: string };

function Segment<T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: Array<Option<T>>;
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <div className="guide-segment">
      <p className="guide-segment-title">{title}</p>
      <div className="guide-segment-options" role="group" aria-label={title}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`guide-segment-option ${value === opt.value ? "guide-segment-option--active" : ""}`}
            onClick={() => onChange(opt.value)}
            aria-pressed={value === opt.value}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function InteractiveBuyingGuide() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const initialAnswers = useMemo(() => parseGuideAnswers(searchParams), [searchParams]);
  const [answers, setAnswers] = useState<GuideAnswers>(initialAnswers);

  const recommendation = useMemo(() => resolveGuideRecommendation(answers), [answers]);

  const setAnswer = <K extends keyof GuideAnswers>(key: K, value: NonNullable<GuideAnswers[K]>) => {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    const params = buildGuideSearchParams(next, searchParams);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const params = buildGuideSearchParams(answers);
    return `${window.location.origin}${pathname}?${params.toString()}`;
  }, [answers, pathname]);

  const styleLabel =
    styleFilterOptions.find((item) => item.value === recommendation.style)?.label ?? recommendation.style;
  const stoneLabel =
    STONE_OPTIONS.find((item) => item.value === recommendation.stone)?.label ?? recommendation.stone;

  const shopHref = `/shop?styles=${recommendation.style}&stones=${recommendation.stone}${answers.budget ? `&budget=${answers.budget}` : ""}`;

  return (
    <section className="interactive-guide" aria-label={fa.guide.title}>
      <header className="interactive-guide-head">
        <h1>{fa.guide.title}</h1>
        <p>{fa.guide.subtitle}</p>
      </header>

      <div className="interactive-guide-grid">
        <Segment
          title={fa.guide.qOccasion}
          value={answers.occasion}
          onChange={(value) => setAnswer("occasion", value)}
          options={[
            { value: "engagement", label: fa.occasions.engagement },
            { value: "wedding", label: fa.occasions.wedding },
            { value: "anniversary", label: fa.occasions.anniversary },
            { value: "gift", label: fa.occasions.gift },
            { value: "everyday", label: fa.occasions.everyday },
          ]}
        />
        <Segment
          title={fa.guide.qVibe}
          value={answers.vibe}
          onChange={(value) => setAnswer("vibe", value)}
          options={[
            { value: "classic", label: fa.guide.vibeClassic },
            { value: "modern", label: fa.guide.vibeModern },
            { value: "bold", label: fa.guide.vibeBold },
            { value: "spiritual", label: fa.guide.vibeSpiritual },
          ]}
        />
        <Segment
          title={fa.guide.qEnergy}
          value={answers.energy}
          onChange={(value) => setAnswer("energy", value)}
          options={[
            { value: "calm", label: fa.guide.energyCalm },
            { value: "power", label: fa.guide.energyPower },
            { value: "focus", label: fa.guide.energyFocus },
            { value: "warmth", label: fa.guide.energyWarmth },
          ]}
        />
        <Segment
          title={fa.guide.qBudget}
          value={answers.budget}
          onChange={(value) => setAnswer("budget", value)}
          options={budgetFilterOptions}
        />
      </div>

      <div className="interactive-guide-result">
        <p className="interactive-guide-result-eyebrow">{fa.guide.resultEyebrow}</p>
        <h2>{fa.guide.resultTitle(styleLabel, stoneLabel)}</h2>
        <p>{fa.guide.resultHint}</p>
        <div className="interactive-guide-actions">
          <a href={shopHref} className="interactive-guide-link">
            {fa.guide.openInShop}
          </a>
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              if (!shareUrl) return;
              try {
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? (
              <Check size={iconSizes.sm} variant="Bold" aria-hidden />
            ) : (
              <Copy size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />
            )}
            {copied ? fa.guide.linkCopied : fa.guide.copyShareLink}
          </Button>
        </div>
      </div>
    </section>
  );
}
