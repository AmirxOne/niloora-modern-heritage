import { Prisma } from "@prisma/client";

export function isPrismaMissingTableOrColumn(error: unknown, name: string): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021" || error.code === "P2022") {
      return error.message.includes(name);
    }
  }
  if (error instanceof Error) {
    return error.message.includes(name) && error.message.includes("does not exist");
  }
  return false;
}
