import Link from "next/link";
import { CheckCircle, Lock, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import type { Chapter, Course, Lesson } from "@prisma/client";

type CourseWithChapters = Course & {
  chapters: (Chapter & { lessons: Lesson[] })[];
};

interface Props {
  course: CourseWithChapters;
  currentLessonId: string;
  completedIds: Set<string>;
  isPurchased: boolean;
}

export function CourseSidebar({
  course,
  currentLessonId,
  completedIds,
  isPurchased,
}: Props) {
  const allLessons = course.chapters.flatMap((ch) => ch.lessons);
  const completedCount = allLessons.filter((l) => completedIds.has(l.id)).length;
  const progressPercent = allLessons.length
    ? Math.round((completedCount / allLessons.length) * 100)
    : 0;

  return (
    <aside className="hidden w-72 flex-shrink-0 overflow-y-auto border-r md:flex md:flex-col">
      <div className="border-b p-4">
        <h2 className="line-clamp-1 font-semibold">{course.title}</h2>
        <div className="mt-2 space-y-1">
          <p className="text-xs text-muted-foreground">
            {completedCount}/{allLessons.length} lessons completed
          </p>
          <Progress value={progressPercent} className="h-1" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {course.chapters.map((chapter) => (
          <div key={chapter.id}>
            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
              {chapter.title}
            </p>
            <div className="space-y-1">
              {chapter.lessons.map((lesson) => {
                const isActive = lesson.id === currentLessonId;
                const isCompleted = completedIds.has(lesson.id);
                const canAccess = isPurchased || lesson.isFree;

                return (
                  <Link
                    key={lesson.id}
                    href={
                      canAccess
                        ? `/courses/${course.id}/lessons/${lesson.id}`
                        : `/courses/${course.id}`
                    }
                    className={cn(
                      "flex items-center gap-2 rounded-md p-2 text-sm transition hover:bg-muted",
                      isActive && "bg-sky-100 text-sky-700 hover:bg-sky-100",
                      !canAccess && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                    ) : canAccess ? (
                      <PlayCircle className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <Lock className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span className="line-clamp-1">{lesson.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
