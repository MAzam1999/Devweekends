"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Role } from "@prisma/client";

const schema = z.object({
  userId: z.string(),
  role: z.nativeEnum(Role),
});

export async function updateUserRole(userId: string, role: Role) {
  await requireRole("admin");
  const parsed = schema.safeParse({ userId, role });
  if (!parsed.success) return { error: "Invalid data" };

  await db.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
  return { success: true };
}
