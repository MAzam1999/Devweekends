import { notFound } from "next/navigation";
import Image from "next/image";
import { BookOpen, CheckCircle, Lock } from "lucide-react";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { Banner } from "@/components/banner";
import { EnrollButton } from "./_components/enroll-button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ success?: string; canceled?: string }>;
}) {
  const authUser = await getAuthUser();
  const { courseId } = await params;
  const { success, canceled } = await searchParams;

  const course = await db.course.findUnique({
    where: { id: courseId, isPublished: true },
    include: {
      category: true,
      instructor: { select: { name: true, imageUrl: true } },
      chapters: {
        where: { isPublished: true },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { position: "asc" },
            select: {
              id: true,
              title: true,
              isFree: true,
              muxPlaybackId: true,
            },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  });
  if (!course) notFound();

  let isPurchased = false;
  if (authUser) {
    const purchase = await db.purchase.findUnique({
      where: { userId_courseId: { userId: authUser.id, courseId: course.id } },
    });
    isPurchased = !!purchase;
  }

  const lessonCount = course.chapters.reduce(
    (acc, ch) => acc + ch.lessons.length,
    0
  );

  const firstLesson = course.chapters[0]?.lessons[0];

  return (
    <div className="mx-auto max-w-5xl p-6">
      {success && (
        <Banner
          label="Payment successful! You now have full access."
          variant="success"
        />
      )}
      {canceled && (
        <Banner label="Payment canceled. You can try again below." />
      )}

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {course.imageUrl && (
            <div className="relative aspect-video overflow-hidden rounded-xl">
              <Image
                src={course.imageUrl}
                alt={course.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div>
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              by {course.instructor.name ?? "Instructor"} ·{" "}
              {course.category?.name}
            </p>
          </div>

          {course.description && (
            <p className="text-muted-foreground">{course.description}</p>
          )}

          <Separator />

          <div>
            <h2 className="mb-4 text-xl font-semibold">Course content</h2>
            <div className="space-y-3">
              {course.chapters.map((chapter) => (
                <div key={chapter.id} className="rounded-lg border">
                  <div className="p-3 font-medium">{chapter.title}</div>
                  <div className="border-t">
                    {chapter.lessons.map((lesson) => {
                      const canAccess = isPurchased || lesson.isFree;
                      return (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-3 border-t px-4 py-2 text-sm first:border-t-0"
                        >
                          {canAccess ? (
                            <BookOpen className="h-4 w-4 text-sky-600" />
                          ) : (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span>{lesson.title}</span>
                          {lesson.isFree && (
                            <Badge variant="outline" className="ml-auto text-xs">
                              Free preview
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="sticky top-24 rounded-xl border bg-card p-6 shadow-sm space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold">
                {course.price ? formatPrice(course.price) : "Free"}
              </p>
            </div>
            <Separator />
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {lessonCount} lessons
              </p>
            </div>
            {isPurchased ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <CheckCircle className="h-4 w-4" />
                  Enrolled
                </div>
                {firstLesson && (
                  <Link
                    href={`/courses/${course.id}/lessons/${firstLesson.id}`}
                    className={cn(buttonVariants(), "w-full")}
                  >
                    Continue learning
                  </Link>
                )}
              </div>
            ) : (
              <EnrollButton
                courseId={course.id}
                price={course.price}
                isLoggedIn={!!authUser}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
