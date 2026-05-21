"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  glass?: boolean;
  hover?: boolean;
}

export function Card({
  children,
  className,
  glass = false,
  hover = true,
  ...props
}: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -6 } : undefined}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "heritage-card",
        glass && "glass-panel",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
