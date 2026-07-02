import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { LessonEditForm } from "./_components/lesson-edit-form";
import { VideoUpload } from "./_components/video-upload";
import { Banner } from "@/components/banner";

export default async function LessonEditPage({
  params,
}: {
  params: { courseId: string; lessonId: string };
}) {
  const user = await requireAuth();
  const lesson = await db.lesson.findUnique({
    where: { id: params.lessonId },
    include: { chapter: { include: { course: true } } },
  });
  if (!lesson) notFound();
  if (
    lesson.chapter.course.instructorId !== user.id &&
    user.role !== "admin"
  ) {
    redirect("/teacher/courses");
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <Link
          href={`/teacher/courses/${params.courseId}`}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to course
        </Link>
      </div>

      {!lesson.isPublished && (
        <Banner label="This lesson is unpublished." />
      )}

      <h1 className="mb-6 text-2xl font-bold">{lesson.title}</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <LessonEditForm lesson={lesson} courseId={params.courseId} />
        <VideoUpload lesson={lesson} courseId={params.courseId} />
      </div>
    </div>
  );
}
