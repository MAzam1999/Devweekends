import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const user = await requireAuth();

  const purchases = await db.purchase.findMany({
    where: { userId: user.id },
    include: {
      course: {
        include: {
          category: true,
          instructor: { select: { name: true } },
          chapters: {
            include: {
              lessons: {
                where: { isPublished: true },
                select: { id: true },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const progress = await db.progress.findMany({
    where: { userId: user.id, isCompleted: true },
    select: { lessonId: true },
  });
  const completedSet = new Set(progress.map((p) => p.lessonId));

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-3xl font-bold">My Learning</h1>

      {purchases.length === 0 ? (
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <BookOpen className="h-16 w-16" />
          <p>You haven&apos;t enrolled in any courses yet.</p>
          <Link
            href="/courses"
            className="text-primary underline underline-offset-2"
          >
            Browse courses
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {purchases.map(({ course }) => {
            const allLessons = course.chapters.flatMap((ch) => ch.lessons);
            const completed = allLessons.filter((l) =>
              completedSet.has(l.id)
            ).length;
            const pct = allLessons.length
              ? Math.round((completed / allLessons.length) * 100)
              : 0;
            const firstLesson = course.chapters[0]?.lessons[0];

            return (
              <Link
                key={course.id}
                href={
                  firstLesson
                    ? `/courses/${course.id}/lessons/${firstLesson.id}`
                    : `/courses/${course.id}`
                }
                className="group"
              >
                <div className="overflow-hidden rounded-lg border bg-card shadow-sm transition hover:shadow-md">
                  <div className="relative aspect-video bg-muted">
                    {course.imageUrl ? (
                      <Image
                        src={course.imageUrl}
                        alt={course.title}
                        fill
                        className="object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <BookOpen className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="line-clamp-1 font-semibold group-hover:text-primary">
                      {course.title}
                    </h3>
                    {course.category && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {course.category.name}
                      </Badge>
                    )}
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{pct}% complete</span>
                        <span>
                          {completed}/{allLessons.length} lessons
                        </span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
