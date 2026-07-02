import Link from "next/link";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import type { Category, Chapter, Course, Lesson, User } from "@prisma/client";

type CourseWithDetails = Course & {
  category: Category | null;
  chapters: (Chapter & { lessons: Lesson[] })[];
  instructor: Pick<User, "name">;
};

export function CourseCard({ course }: { course: CourseWithDetails }) {
  const lessonCount = course.chapters.reduce(
    (acc, ch) => acc + ch.lessons.length,
    0
  );

  return (
    <Link href={`/courses/${course.id}`} className="group">
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
          <h3 className="line-clamp-2 font-semibold group-hover:text-primary">
            {course.title}
          </h3>
          {course.category && (
            <p className="mt-1 text-xs text-muted-foreground">
              {course.category.name}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            by {course.instructor.name ?? "Instructor"}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <BookOpen className="h-3 w-3" />
              {lessonCount} lesson{lessonCount !== 1 ? "s" : ""}
            </span>
            <Badge variant="secondary">
              {course.price ? formatPrice(course.price) : "Free"}
            </Badge>
          </div>
        </div>
      </div>
    </Link>
  );
}
