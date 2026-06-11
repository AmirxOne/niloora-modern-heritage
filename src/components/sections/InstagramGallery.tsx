"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { fa } from "@/lib/i18n/fa";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useHomeDataContext } from "@/lib/context/HomeDataContext";

export function InstagramGallery() {
  const { instagramPosts, isLoading } = useHomeDataContext();

  return (
    <section className="heritage-section">
      <div className="site-container">
        <SectionHeading
          eyebrow={fa.home.galleryEyebrow}
          title={fa.home.galleryTitle}
          subtitle={fa.home.gallerySubtitle}
        />
        <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3 md:gap-2.5 lg:grid-cols-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="sk group relative aspect-square overflow-hidden rounded-heritage"
                  aria-busy="true"
                >
                </div>
              ))
            : instagramPosts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.5 }}
                  whileHover={{ scale: 1.03 }}
                  className="group relative aspect-square overflow-hidden rounded-heritage border border-gold/10 shadow-heritage"
                >
                  <Image
                    src={post.image}
                    alt="پست اینستاگرام"
                    fill
                    loading="lazy"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-stone-900/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="text-sm text-white">
                      ♥ {post.likes.toLocaleString("fa-IR")}
                    </span>
                  </div>
                </motion.div>
              ))}
        </div>
      </div>
    </section>
  );
}
