"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function adminTogglePublish(courseId: string, publish: boolean) {
  await requireRole("admin");
  await db.course.update({
    where: { id: courseId },
    data: { isPublished: publish },
  });
  revalidatePath("/admin/courses");
  return { success: true };
}

export async function adminDeleteCourse(courseId: string) {
  await requireRole("admin");
  await db.course.delete({ where: { id: courseId } });
  revalidatePath("/admin/courses");
  return { success: true };
}
