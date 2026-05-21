"use client";

import { motion } from "framer-motion";
import { fa } from "@/lib/i18n/fa";

interface ShopCollectionHeaderProps {
  resultCount: number;
  query?: string;
  isSearchPage?: boolean;
}

export function ShopCollectionHeader({
  resultCount,
  query,
  isSearchPage = false,
}: ShopCollectionHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="shop-collection-header"
    >
      <p className="shop-collection-eyebrow">{fa.shop.eyebrow}</p>
      <div className="shop-collection-header-main">
        <h1 className="shop-collection-title">
          {isSearchPage ? fa.shop.searchPageTitle : fa.shop.title}
        </h1>
      </div>
      {query?.trim() ? (
        <p className="mt-2 text-xs text-silver">
          {fa.shop.searchResultsFor(query.trim())}
        </p>
      ) : null}
    </motion.header>
  );
}
