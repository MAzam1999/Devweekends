"use client";

import { useState } from "react";
import { Trash } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { publishCourse, unpublishCourse, deleteCourse } from "../../actions";
import { ConfirmModal } from "@/components/confirm-modal";

interface Props {
  courseId: string;
  isPublished: boolean;
  isComplete: boolean;
}

export function CourseActions({ courseId, isPublished, isComplete }: Props) {
  const [isPending, setIsPending] = useState(false);

  async function handlePublishToggle() {
    setIsPending(true);
    try {
      const result = isPublished
        ? await unpublishCourse(courseId)
        : await publishCourse(courseId);
      if (result?.error) toast.error(result.error);
      else toast.success(isPublished ? "Course unpublished" : "Course published!");
    } finally {
      setIsPending(false);
    }
  }

  async function handleDelete() {
    setIsPending(true);
    try {
      const result = await deleteCourse(courseId);
      if (result?.error) toast.error(result.error);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handlePublishToggle}
        disabled={isPending || (!isComplete && !isPublished)}
        variant={isPublished ? "outline" : "default"}
        size="sm"
      >
        {isPublished ? "Unpublish" : "Publish"}
      </Button>
      <ConfirmModal onConfirm={handleDelete}>
        <Button variant="destructive" size="sm" disabled={isPending}>
          <Trash className="h-4 w-4" />
        </Button>
      </ConfirmModal>
    </div>
  );
}
