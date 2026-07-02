"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function markProgress(
  lessonId: string,
  courseId: string,
  isCompleted: boolean
) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { chapter: true },
  });
  if (!lesson || lesson.chapter.courseId !== courseId) {
    throw new Error("Lesson not found");
  }

  const purchase = await db.purchase.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
  });
  if (!purchase && !lesson.isFree) throw new Error("Not enrolled");

  await db.progress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: { userId: user.id, lessonId, isCompleted },
    update: { isCompleted },
  });

  revalidatePath(`/courses/${courseId}/lessons/${lessonId}`);
}
