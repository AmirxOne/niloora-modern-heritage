import { cn } from "@/lib/utils";

interface OrnamentalDividerProps {
  className?: string;
}

export function OrnamentalDivider({ className }: OrnamentalDividerProps) {
  return (
    <div className={cn("flex items-center justify-center gap-3", className)} aria-hidden>
      <span className="h-px max-w-[4rem] flex-1 bg-gradient-to-l from-transparent to-gold/40" />
      <svg className="h-3 w-3 shrink-0 text-gold/70" viewBox="0 0 12 12" fill="currentColor">
        <path d="M6 0l1.2 2.4 2.6.4-1.9 1.8.4 2.6L6 5.8 3.7 7.2l.4-2.6L2.2 2.8 4.8 2.4z" />
      </svg>
      <span className="h-px max-w-[4rem] flex-1 bg-gradient-to-r from-transparent to-gold/40" />
    </div>
  );
}
