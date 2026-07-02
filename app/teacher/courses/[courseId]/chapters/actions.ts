"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

async function verifyInstructor(courseId: string) {
  const user = await requireAuth();
  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) throw new Error("Course not found");
  if (course.instructorId !== user.id && user.role !== "admin")
    throw new Error("Forbidden");
  return { user, course };
}

export async function createChapter(courseId: string, title: string) {
  await verifyInstructor(courseId);
  const lastChapter = await db.chapter.findFirst({
    where: { courseId },
    orderBy: { position: "desc" },
  });
  const position = (lastChapter?.position ?? 0) + 1;
  const chapter = await db.chapter.create({
    data: { title, courseId, position },
  });
  revalidatePath(`/teacher/courses/${courseId}`);
  return { success: true, chapter };
}

export async function updateChapter(
  courseId: string,
  chapterId: string,
  data: { title?: string; isPublished?: boolean }
) {
  await verifyInstructor(courseId);
  await db.chapter.update({ where: { id: chapterId }, data });
  revalidatePath(`/teacher/courses/${courseId}`);
  return { success: true };
}

export async function deleteChapter(courseId: string, chapterId: string) {
  await verifyInstructor(courseId);
  await db.chapter.delete({ where: { id: chapterId } });
  revalidatePath(`/teacher/courses/${courseId}`);
  return { success: true };
}

export async function reorderChapters(
  courseId: string,
  items: { id: string; position: number }[]
) {
  await verifyInstructor(courseId);
  await Promise.all(
    items.map((item) =>
      db.chapter.update({
        where: { id: item.id },
        data: { position: item.position },
      })
    )
  );
  revalidatePath(`/teacher/courses/${courseId}`);
  return { success: true };
}

export async function createLesson(
  courseId: string,
  chapterId: string,
  title: string
) {
  await verifyInstructor(courseId);
  const lastLesson = await db.lesson.findFirst({
    where: { chapterId },
    orderBy: { position: "desc" },
  });
  const position = (lastLesson?.position ?? 0) + 1;
  const lesson = await db.lesson.create({
    data: { title, chapterId, position },
  });
  revalidatePath(`/teacher/courses/${courseId}`);
  return { success: true, lesson };
}

export async function updateLesson(
  courseId: string,
  lessonId: string,
  data: {
    title?: string;
    description?: string;
    isFree?: boolean;
    isPublished?: boolean;
    muxAssetId?: string;
    muxPlaybackId?: string;
  }
) {
  await verifyInstructor(courseId);
  await db.lesson.update({ where: { id: lessonId }, data });
  revalidatePath(`/teacher/courses/${courseId}`);
  return { success: true };
}

export async function deleteLesson(courseId: string, lessonId: string) {
  await verifyInstructor(courseId);
  const lesson = await db.lesson.findUnique({ where: { id: lessonId } });
  if (lesson?.muxAssetId) {
    const { mux } = await import("@/lib/mux");
    await mux.video.assets.delete(lesson.muxAssetId).catch(() => {});
  }
  await db.lesson.delete({ where: { id: lessonId } });
  revalidatePath(`/teacher/courses/${courseId}`);
  return { success: true };
}

export async function reorderLessons(
  courseId: string,
  items: { id: string; position: number }[]
) {
  await verifyInstructor(courseId);
  await Promise.all(
    items.map((item) =>
      db.lesson.update({
        where: { id: item.id },
        data: { position: item.position },
      })
    )
  );
  revalidatePath(`/teacher/courses/${courseId}`);
  return { success: true };
}
