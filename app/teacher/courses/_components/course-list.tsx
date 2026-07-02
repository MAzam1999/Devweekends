import Link from "next/link";
import { BookOpen, Eye, EyeOff, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Category, Chapter, Course, Lesson } from "@prisma/client";

type CourseWithDetails = Course & {
  category: Category | null;
  chapters: (Chapter & { lessons: Lesson[] })[];
};

export function CourseList({ courses }: { courses: CourseWithDetails[] }) {
  if (courses.length === 0) {
    return (
      <div className="mt-10 flex flex-col items-center justify-center text-muted-foreground">
        <BookOpen className="mb-2 h-12 w-12" />
        <p className="text-sm">No courses yet. Create your first course!</p>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => {
        const lessonCount = course.chapters.reduce(
          (acc, ch) => acc + ch.lessons.length,
          0
        );
        return (
          <div
            key={course.id}
            className="group rounded-lg border bg-card p-4 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <h2 className="line-clamp-2 font-semibold">{course.title}</h2>
              <Badge variant={course.isPublished ? "default" : "secondary"}>
                {course.isPublished ? (
                  <Eye className="mr-1 h-3 w-3" />
                ) : (
                  <EyeOff className="mr-1 h-3 w-3" />
                )}
                {course.isPublished ? "Published" : "Draft"}
              </Badge>
            </div>
            {course.category && (
              <p className="mt-1 text-xs text-muted-foreground">
                {course.category.name}
              </p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">
              {lessonCount} lesson{lessonCount !== 1 ? "s" : ""} ·{" "}
              {course.price ? formatPrice(course.price) : "Free"}
            </p>
            <div className="mt-4">
              <Link
                href={`/teacher/courses/${course.id}`}
                className={cn(buttonVariants({ size: "sm", variant: "outline" }), "w-full")}
              >
                <Pencil className="mr-2 h-3 w-3" />
                Edit
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
