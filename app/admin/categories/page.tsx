import { db } from "@/lib/db";
import { CategoryManager } from "./_components/category-manager";

export default async function AdminCategoriesPage() {
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { courses: true } } },
  });

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Categories</h1>
      <CategoryManager categories={categories} />
    </div>
  );
}
