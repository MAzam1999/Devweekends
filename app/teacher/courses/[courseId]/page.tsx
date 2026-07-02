import { redirect, notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CourseEditForm } from "./_components/course-edit-form";
import { ChapterList } from "./_components/chapter-list";
import { CourseActions } from "./_components/course-actions";
import { ImageUpload } from "./_components/image-upload";
import { Banner } from "@/components/banner";
import { formatPrice } from "@/lib/format";

export default async function CourseEditPage({
  params,
}: {
  params: { courseId: string };
}) {
  const user = await requireAuth();
  const course = await db.course.findUnique({
    where: { id: params.courseId },
    include: {
      category: true,
      chapters: {
        include: { lessons: { orderBy: { position: "asc" } } },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!course) notFound();
  if (course.instructorId !== user.id && user.role !== "admin") redirect("/teacher/courses");

  const categories = await db.category.findMany({ orderBy: { name: "asc" } });

  const requiredFields = [
    course.title,
    course.description,
    course.imageUrl,
    course.price,
    course.categoryId,
    course.chapters.some((ch) => ch.lessons.length > 0),
  ];
  const completedFields = requiredFields.filter(Boolean).length;
  const totalFields = requiredFields.length;
  const isComplete = requiredFields.every(Boolean);

  return (
    <div className="p-6">
      {!course.isPublished && (
        <Banner label="This course is unpublished. It will not be visible to students." />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="text-sm text-muted-foreground">
            Complete all fields ({completedFields}/{totalFields})
          </p>
        </div>
        <CourseActions
          courseId={course.id}
          isPublished={course.isPublished}
          isComplete={isComplete}
        />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <CourseEditForm course={course} categories={categories} />
        </div>
        <div className="space-y-6">
          <ImageUpload courseId={course.id} imageUrl={course.imageUrl} />
          <ChapterList courseId={course.id} chapters={course.chapters} />
        </div>
      </div>
    </div>
  );
}
