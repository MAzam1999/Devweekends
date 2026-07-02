"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Trash } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/confirm-modal";
import { adminTogglePublish, adminDeleteCourse } from "../actions";
import type { Category, Course, User } from "@prisma/client";

type CourseWithDetails = Course & {
  category: Category | null;
  instructor: Pick<User, "name">;
  _count: { purchases: number; chapters: number };
};

export function AdminCourseTable({ courses }: { courses: CourseWithDetails[] }) {
  const [pending, setPending] = useState<string | null>(null);
  const [list, setList] = useState(courses);

  async function handleToggle(courseId: string, current: boolean) {
    setPending(courseId);
    try {
      await adminTogglePublish(courseId, !current);
      setList((prev) =>
        prev.map((c) =>
          c.id === courseId ? { ...c, isPublished: !current } : c
        )
      );
      toast.success(!current ? "Published" : "Unpublished");
    } catch {
      toast.error("Failed");
    } finally {
      setPending(null);
    }
  }

  async function handleDelete(courseId: string) {
    setPending(courseId);
    try {
      await adminDeleteCourse(courseId);
      setList((prev) => prev.filter((c) => c.id !== courseId));
      toast.success("Course deleted");
    } catch {
      toast.error("Failed");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Instructor</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Sales</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((course) => (
            <TableRow key={course.id}>
              <TableCell className="font-medium max-w-[200px] truncate">
                {course.title}
              </TableCell>
              <TableCell>{course.instructor.name ?? "—"}</TableCell>
              <TableCell>{course.category?.name ?? "—"}</TableCell>
              <TableCell>{course._count.purchases}</TableCell>
              <TableCell>
                <Badge variant={course.isPublished ? "default" : "secondary"}>
                  {course.isPublished ? "Published" : "Draft"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending === course.id}
                    onClick={() => handleToggle(course.id, course.isPublished)}
                  >
                    {course.isPublished ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                  <ConfirmModal
                    onConfirm={() => handleDelete(course.id)}
                    description="This will permanently delete the course and all its content."
                  >
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={pending === course.id}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </ConfirmModal>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
