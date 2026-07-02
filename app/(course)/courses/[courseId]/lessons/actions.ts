"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function markProgress(
  lessonId: string,
  courseId: string,
  isCompleted: boolean
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");

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
