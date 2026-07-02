import { db } from "@/lib/db";
import { AdminCourseTable } from "./_components/admin-course-table";

export default async function AdminCoursesPage() {
  const courses = await db.course.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      instructor: { select: { name: true } },
      _count: { select: { purchases: true, chapters: true } },
    },
  });

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">All Courses ({courses.length})</h1>
      <AdminCourseTable courses={courses} />
    </div>
  );
}
