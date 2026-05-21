import type { HomeTestimonialDto } from "@/lib/types/home-content";
import { prisma } from "@/lib/server/prisma";

export function mapTestimonial(row: {
  id: string;
  name: string;
  location: string;
  text: string;
  rating: number;
  sortOrder: number;
}): HomeTestimonialDto {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    text: row.text,
    rating: row.rating,
    sortOrder: row.sortOrder,
  };
}

export async function listHomeTestimonials(): Promise<HomeTestimonialDto[]> {
  const rows = await prisma.homeTestimonial.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return rows.map(mapTestimonial);
}

export async function createTestimonial(input: {
  name: string;
  location: string;
  text: string;
  rating: number;
  sortOrder?: number;
}) {
  return prisma.homeTestimonial.create({
    data: {
      name: input.name.trim(),
      location: input.location.trim(),
      text: input.text.trim(),
      rating: Math.min(5, Math.max(1, Math.round(input.rating))),
      sortOrder: input.sortOrder ?? 0,
    },
  });
}

export async function updateTestimonial(
  id: string,
  input: Partial<{
    name: string;
    location: string;
    text: string;
    rating: number;
    sortOrder: number;
  }>
) {
  return prisma.homeTestimonial.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.location !== undefined ? { location: input.location.trim() } : {}),
      ...(input.text !== undefined ? { text: input.text.trim() } : {}),
      ...(input.rating !== undefined
        ? { rating: Math.min(5, Math.max(1, Math.round(input.rating))) }
        : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    },
  });
}

export async function deleteTestimonial(id: string) {
  return prisma.homeTestimonial.delete({ where: { id } });
}
