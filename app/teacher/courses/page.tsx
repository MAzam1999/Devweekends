import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { CourseList } from "./_components/course-list";
import { cn } from "@/lib/utils";

export default async function TeacherCoursesPage() {
  const user = await requireAuth();
  const courses = await db.course.findMany({
    where: { instructorId: user.id },
    include: { category: true, chapters: { include: { lessons: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Courses</h1>
        <Link href="/teacher/courses/new" className={cn(buttonVariants())}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Course
        </Link>
      </div>
      <CourseList courses={courses} />
    </div>
  );
}
