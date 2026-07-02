"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createCategory, deleteCategory } from "../actions";
import type { Category } from "@prisma/client";

type CategoryWithCount = Category & { _count: { courses: number } };

export function CategoryManager({
  categories: initial,
}: {
  categories: CategoryWithCount[];
}) {
  const [categories, setCategories] = useState(initial);
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    const formData = new FormData();
    formData.set("name", name.trim());
    startTransition(async () => {
      const result = await createCategory(formData);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Category created!");
        setName("");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteCategory(id);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        toast.success("Category deleted");
      }
    });
  }

  return (
    <div className="space-y-6 max-w-md">
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          disabled={isPending}
        />
        <Button onClick={handleCreate} disabled={isPending || !name.trim()}>
          Add
        </Button>
      </div>

      <div className="space-y-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="flex items-center gap-3">
              <span className="font-medium">{cat.name}</span>
              <Badge variant="secondary">{cat._count.courses} courses</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(cat.id)}
              disabled={isPending || cat._count.courses > 0}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
