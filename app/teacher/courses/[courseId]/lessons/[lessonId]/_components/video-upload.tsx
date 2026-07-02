"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateLesson } from "../../../chapters/actions";
import type { Lesson } from "@prisma/client";

interface Props {
  lesson: Lesson;
  courseId: string;
}

export function VideoUpload({ lesson, courseId }: Props) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsPending(true);
    try {
      const res = await fetch("/api/mux/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id, courseId }),
      });
      const { uploadUrl, assetId } = await res.json();
      if (!res.ok) throw new Error("Failed to get upload URL");

      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      await updateLesson(courseId, lesson.id, { muxAssetId: assetId });
      toast.success("Video uploaded! Processing may take a few minutes.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="font-semibold">Video</h3>

      {lesson.muxPlaybackId ? (
        <div className="mt-4 flex flex-col items-center gap-2 text-green-600">
          <Video className="h-10 w-10" />
          <p className="text-sm font-medium">Video ready</p>
          <p className="text-xs text-muted-foreground">
            Playback ID: {lesson.muxPlaybackId.slice(0, 8)}…
          </p>
        </div>
      ) : lesson.muxAssetId ? (
        <div className="mt-4 flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="text-sm">Processing video…</p>
        </div>
      ) : (
        <div className="mt-4">
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed p-6 text-center hover:bg-muted/50">
            <Video className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">Upload video</p>
            <p className="text-xs text-muted-foreground">MP4, MOV, AVI up to 10GB</p>
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleUpload}
              disabled={isPending}
            />
          </label>
          {isPending && (
            <p className="mt-2 text-center text-sm text-muted-foreground">
              <Loader2 className="mr-1 inline-block h-3 w-3 animate-spin" />
              Uploading…
            </p>
          )}
        </div>
      )}

      {lesson.muxAssetId && !lesson.muxPlaybackId && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4 w-full"
          onClick={() => router.refresh()}
        >
          Refresh status
        </Button>
      )}
    </div>
  );
}
