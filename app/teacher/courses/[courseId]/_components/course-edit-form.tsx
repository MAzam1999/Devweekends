"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateCourse } from "../../actions";
import type { Category, Course } from "@prisma/client";

interface Props {
  course: Course & { category: Category | null };
  categories: Category[];
}

type Field = "title" | "description" | "price" | "category";

export function CourseEditForm({ course, categories }: Props) {
  const [editing, setEditing] = useState<Field | null>(null);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleSave(field: Field, value: string) {
    setIsPending(true);
    try {
      const payload: Record<string, unknown> = { courseId: course.id };
      if (field === "title") payload.title = value;
      if (field === "description") payload.description = value;
      if (field === "price") payload.price = parseFloat(value);
      if (field === "category") payload.categoryId = value;

      const result = await updateCourse(payload as Parameters<typeof updateCourse>[0]);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Updated!");
        setEditing(null);
        router.refresh();
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold">Course details</h2>

      {/* Title */}
      <EditableField
        label="Title"
        value={course.title}
        isEditing={editing === "title"}
        onEdit={() => setEditing("title")}
        onCancel={() => setEditing(null)}
        onSave={(v) => handleSave("title", v)}
        isPending={isPending}
        renderInput={(value, onChange) => (
          <Input value={value} onChange={(e) => onChange(e.target.value)} />
        )}
      />

      {/* Description */}
      <EditableField
        label="Description"
        value={course.description ?? ""}
        placeholder="No description"
        isEditing={editing === "description"}
        onEdit={() => setEditing("description")}
        onCancel={() => setEditing(null)}
        onSave={(v) => handleSave("description", v)}
        isPending={isPending}
        renderInput={(value, onChange) => (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
          />
        )}
      />

      {/* Price */}
      <EditableField
        label="Price (USD)"
        value={course.price ? (course.price / 100).toString() : ""}
        placeholder="Free"
        isEditing={editing === "price"}
        onEdit={() => setEditing("price")}
        onCancel={() => setEditing(null)}
        onSave={(v) => handleSave("price", v)}
        isPending={isPending}
        renderInput={(value, onChange) => (
          <Input
            type="number"
            min="0"
            step="0.01"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
      />

      {/* Category */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label>Category</Label>
          {editing !== "category" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing("category")}
            >
              <Pencil className="h-3 w-3 mr-1" /> Edit
            </Button>
          )}
        </div>
        {editing === "category" ? (
          <div className="space-y-2">
            <Select
              value={course.categoryId ?? undefined}
              onValueChange={(v) => v && handleSave("category", v)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(null)}
            >
              <X className="h-3 w-3" /> Cancel
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {course.category?.name ?? "No category"}
          </p>
        )}
      </div>
    </div>
  );
}

interface EditableFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (value: string) => void;
  isPending: boolean;
  renderInput: (
    value: string,
    onChange: (v: string) => void
  ) => React.ReactNode;
}

function EditableField({
  label,
  value,
  placeholder = "Not set",
  isEditing,
  onEdit,
  onCancel,
  onSave,
  isPending,
  renderInput,
}: EditableFieldProps) {
  const [draft, setDraft] = useState(value);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {!isEditing && (
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="mr-1 h-3 w-3" /> Edit
          </Button>
        )}
      </div>
      {isEditing ? (
        <div className="space-y-2">
          {renderInput(draft, setDraft)}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => onSave(draft)}
              disabled={isPending}
            >
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setDraft(value); onCancel(); }}
              disabled={isPending}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {value || placeholder}
        </p>
      )}
    </div>
  );
}
