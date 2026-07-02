import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { signMuxPlaybackToken } from "@/lib/mux-tokens";
import { VideoPlayer } from "./_components/video-player";
import { CourseSidebar } from "./_components/course-sidebar";

export default async function LessonPlayerPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { lessonId } = await params;
  const user = await getAuthUser();
  if (!user) redirect("/sign-in");

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      chapter: {
        include: {
          course: {
            include: {
              chapters: {
                include: {
                  lessons: { orderBy: { position: "asc" } },
                },
                orderBy: { position: "asc" },
              },
            },
          },
        },
      },
    },
  });
  if (!lesson) notFound();
  if (!lesson.isPublished) notFound();

  const course = lesson.chapter.course;
  if (!course.isPublished) notFound();

  const purchase = await db.purchase.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: course.id } },
  });

  const canAccess = !!purchase || lesson.isFree;
  if (!canAccess) redirect(`/courses/${course.id}`);

  const progress = await db.progress.findMany({
    where: { userId: user.id, lesson: { chapter: { courseId: course.id } } },
  });
  const completedIds = new Set(
    progress.filter((p) => p.isCompleted).map((p) => p.lessonId)
  );

  let playbackToken: string | null = null;
  if (lesson.muxPlaybackId) {
    playbackToken = signMuxPlaybackToken(lesson.muxPlaybackId);
  }

  return (
    <div className="flex h-[calc(100vh-80px)]">
      <CourseSidebar
        course={course}
        currentLessonId={lesson.id}
        completedIds={completedIds}
        isPurchased={!!purchase}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <VideoPlayer
          lessonId={lesson.id}
          courseId={course.id}
          playbackId={lesson.muxPlaybackId}
          playbackToken={playbackToken}
          isCompleted={completedIds.has(lesson.id)}
          nextLessonId={getNextLessonId(course.chapters, lesson.id)}
        />
        <div className="mt-6">
          <h1 className="text-2xl font-bold">{lesson.title}</h1>
          {lesson.description && (
            <p className="mt-2 text-muted-foreground">{lesson.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function getNextLessonId(
  chapters: Array<{ lessons: Array<{ id: string }> }>,
  currentId: string
): string | null {
  const allLessons = chapters.flatMap((ch) => ch.lessons);
  const idx = allLessons.findIndex((l) => l.id === currentId);
  return allLessons[idx + 1]?.id ?? null;
}
