"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "start" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "page-header mb-8 md:mb-10",
        align === "center" && "page-header--center",
        className
      )}
    >
      {eyebrow ? <p className="page-eyebrow">{eyebrow}</p> : null}
      <h2 className="page-header-title md:text-[2rem] lg:text-[2.25rem]">{title}</h2>
      {subtitle ? (
        <p
          className={cn(
            "page-header-subtitle md:text-base",
            align === "center" && "mx-auto"
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </motion.header>
  );
}
