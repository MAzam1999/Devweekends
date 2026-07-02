import { db } from "@/lib/db";
import { CourseCard } from "./_components/course-card";
import { SearchInput } from "./_components/search-input";
import { CategoryFilter } from "./_components/category-filter";

interface SearchParams {
  search?: string;
  categoryId?: string;
}

export default async function CourseCatalogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { search, categoryId } = searchParams;

  const [courses, categories] = await Promise.all([
    db.course.findMany({
      where: {
        isPublished: true,
        ...(categoryId ? { categoryId } : {}),
        ...(search
          ? { title: { contains: search, mode: "insensitive" } }
          : {}),
      },
      include: {
        category: true,
        chapters: { include: { lessons: true } },
        instructor: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Course Catalog</h1>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <SearchInput defaultValue={search} />
        <CategoryFilter categories={categories} selectedId={categoryId} />
      </div>
      {courses.length === 0 ? (
        <p className="text-center text-muted-foreground">No courses found.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
