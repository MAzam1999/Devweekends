"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth";

const createCourseSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
});

export async function createCourse(formData: FormData) {
  const user = await requireAuth();
  if (user.role !== "instructor" && user.role !== "admin") {
    return { error: "Only instructors can create courses" };
  }

  const parsed = createCourseSchema.safeParse({
    title: formData.get("title"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message };
  }

  const course = await db.course.create({
    data: {
      title: parsed.data.title,
      instructorId: user.id,
    },
  });

  redirect(`/teacher/courses/${course.id}`);
}

const updateCourseSchema = z.object({
  courseId: z.string(),
  title: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  price: z.coerce.number().min(0).optional(),
  categoryId: z.string().optional(),
});

export async function updateCourse(data: z.infer<typeof updateCourseSchema>) {
  const user = await requireAuth();
  const parsed = updateCourseSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  const { courseId, ...fields } = parsed.data;

  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) return { error: "Course not found" };
  if (course.instructorId !== user.id && user.role !== "admin") {
    return { error: "Forbidden" };
  }

  const updateData: Record<string, unknown> = {};
  if (fields.title !== undefined) updateData.title = fields.title;
  if (fields.description !== undefined) updateData.description = fields.description;
  if (fields.imageUrl !== undefined) updateData.imageUrl = fields.imageUrl || null;
  if (fields.price !== undefined) updateData.price = Math.round(fields.price * 100);
  if (fields.categoryId !== undefined) updateData.categoryId = fields.categoryId || null;

  await db.course.update({ where: { id: courseId }, data: updateData });

  revalidatePath(`/teacher/courses/${courseId}`);
  return { success: true };
}

export async function publishCourse(courseId: string) {
  const user = await requireAuth();

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      chapters: { include: { lessons: true } },
    },
  });
  if (!course) return { error: "Course not found" };
  if (course.instructorId !== user.id && user.role !== "admin") {
    return { error: "Forbidden" };
  }

  const hasLesson = course.chapters.some((ch) => ch.lessons.length > 0);
  if (!course.title || !course.description || !hasLesson) {
    return { error: "Course must have title, description, and at least one lesson" };
  }

  await db.course.update({
    where: { id: courseId },
    data: { isPublished: true },
  });

  revalidatePath(`/teacher/courses/${courseId}`);
  return { success: true };
}

export async function unpublishCourse(courseId: string) {
  const user = await requireAuth();

  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) return { error: "Course not found" };
  if (course.instructorId !== user.id && user.role !== "admin") {
    return { error: "Forbidden" };
  }

  await db.course.update({
    where: { id: courseId },
    data: { isPublished: false },
  });

  revalidatePath(`/teacher/courses/${courseId}`);
  return { success: true };
}

export async function deleteCourse(courseId: string) {
  const user = await requireAuth();

  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) return { error: "Course not found" };
  if (course.instructorId !== user.id && user.role !== "admin") {
    return { error: "Forbidden" };
  }

  await db.course.delete({ where: { id: courseId } });
  revalidatePath("/teacher/courses");
  redirect("/teacher/courses");
}
