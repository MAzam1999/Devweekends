"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

const schema = z.object({ name: z.string().min(1).max(50) });

type ActionResult = { success: true } | { error: string };

export async function createCategory(formData: FormData): Promise<ActionResult> {
  await requireRole("admin");
  const parsed = schema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid" };

  const exists = await db.category.findUnique({ where: { name: parsed.data.name } });
  if (exists) return { error: "Category already exists" };

  await db.category.create({ data: { name: parsed.data.name } });
  revalidatePath("/admin/categories");
  return { success: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireRole("admin");
  await db.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  return { success: true };
}
