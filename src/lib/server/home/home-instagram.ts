import type { HomeInstagramPostDto } from "@/lib/types/home-content";
import { prisma } from "@/lib/server/prisma";

export function mapInstagramPost(row: {
  id: string;
  image: string;
  likes: number;
  sortOrder: number;
}): HomeInstagramPostDto {
  return {
    id: row.id,
    image: row.image,
    likes: row.likes,
    sortOrder: row.sortOrder,
  };
}

export async function listHomeInstagramPosts(): Promise<HomeInstagramPostDto[]> {
  const rows = await prisma.homeInstagramPost.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return rows.map(mapInstagramPost);
}

export async function createInstagramPost(input: {
  image: string;
  likes?: number;
  sortOrder?: number;
}) {
  const image = input.image.trim();
  if (!image) throw new Error("IMAGE_REQUIRED");
  return prisma.homeInstagramPost.create({
    data: {
      image,
      likes: Math.max(0, Math.round(input.likes ?? 0)),
      sortOrder: input.sortOrder ?? 0,
    },
  });
}

export async function updateInstagramPost(
  id: string,
  input: Partial<{ image: string; likes: number; sortOrder: number }>
) {
  return prisma.homeInstagramPost.update({
    where: { id },
    data: {
      ...(input.image !== undefined ? { image: input.image.trim() } : {}),
      ...(input.likes !== undefined ? { likes: Math.max(0, Math.round(input.likes)) } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    },
  });
}

export async function deleteInstagramPost(id: string) {
  return prisma.homeInstagramPost.delete({ where: { id } });
}
