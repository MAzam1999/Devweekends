"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateLesson } from "../../../chapters/actions";
import type { Lesson } from "@prisma/client";

export function LessonEditForm({
  lesson,
  courseId,
}: {
  lesson: Lesson;
  courseId: string;
}) {
  const [editing, setEditing] = useState<"title" | "description" | null>(null);
  const [draftTitle, setDraftTitle] = useState(lesson.title);
  const [draftDesc, setDraftDesc] = useState(lesson.description ?? "");
  const [isFree, setIsFree] = useState(lesson.isFree);
  const [isPublished, setIsPublished] = useState(lesson.isPublished);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function save(data: Parameters<typeof updateLesson>[2]) {
    setIsPending(true);
    try {
      await updateLesson(courseId, lesson.id, data);
      toast.success("Updated!");
      setEditing(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-6">
      <h2 className="font-semibold">Lesson details</h2>

      {/* Title */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label>Title</Label>
          {editing !== "title" && (
            <Button variant="ghost" size="sm" onClick={() => setEditing("title")}>
              <Pencil className="mr-1 h-3 w-3" /> Edit
            </Button>
          )}
        </div>
        {editing === "title" ? (
          <div className="space-y-2">
            <Input
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              disabled={isPending}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => save({ title: draftTitle })} disabled={isPending}>
                Save
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{lesson.title}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label>Description</Label>
          {editing !== "description" && (
            <Button variant="ghost" size="sm" onClick={() => setEditing("description")}>
              <Pencil className="mr-1 h-3 w-3" /> Edit
            </Button>
          )}
        </div>
        {editing === "description" ? (
          <div className="space-y-2">
            <Textarea
              value={draftDesc}
              onChange={(e) => setDraftDesc(e.target.value)}
              rows={4}
              disabled={isPending}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => save({ description: draftDesc })} disabled={isPending}>
                Save
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {lesson.description || "No description"}
          </p>
        )}
      </div>

      {/* Free preview toggle */}
      <div className="flex items-center justify-between rounded-md border p-3">
        <div>
          <p className="text-sm font-medium">Free preview</p>
          <p className="text-xs text-muted-foreground">
            Allow non-enrolled users to watch this lesson
          </p>
        </div>
        <Button
          variant={isFree ? "default" : "outline"}
          size="sm"
          disabled={isPending}
          onClick={() => {
            const next = !isFree;
            setIsFree(next);
            save({ isFree: next });
          }}
        >
          {isFree ? "Free" : "Paid"}
        </Button>
      </div>

      {/* Publish toggle */}
      <Button
        className="w-full"
        variant={isPublished ? "outline" : "default"}
        disabled={isPending || !lesson.muxPlaybackId}
        onClick={() => {
          const next = !isPublished;
          setIsPublished(next);
          save({ isPublished: next });
        }}
      >
        {isPublished ? "Unpublish lesson" : "Publish lesson"}
      </Button>
      {!lesson.muxPlaybackId && (
        <p className="text-center text-xs text-muted-foreground">
          Upload a video to publish this lesson
        </p>
      )}
    </div>
  );
}
