"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { markProgress } from "../../actions";

interface Props {
  lessonId: string;
  courseId: string;
  playbackId: string | null;
  playbackToken: string | null;
  isCompleted: boolean;
  nextLessonId: string | null;
}

export function VideoPlayer({
  lessonId,
  courseId,
  playbackId,
  playbackToken,
  isCompleted,
  nextLessonId,
}: Props) {
  const [completed, setCompleted] = useState(isCompleted);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleToggle() {
    setIsPending(true);
    try {
      const next = !completed;
      await markProgress(lessonId, courseId, next);
      setCompleted(next);
      toast.success(next ? "Lesson completed!" : "Marked as incomplete");
      if (next && nextLessonId) {
        router.push(`/courses/${courseId}/lessons/${nextLessonId}`);
      } else {
        router.refresh();
      }
    } catch {
      toast.error("Failed to update progress");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-4">
      {playbackId && playbackToken ? (
        <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
          {/* @ts-ignore mux-player-react web component */}
          <mux-player
            playback-id={playbackId}
            tokens={JSON.stringify({ playback: playbackToken })}
            stream-type="on-demand"
            className="h-full w-full"
            style={{ height: "100%", width: "100%" }}
          />
        </div>
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-xl bg-muted">
          <p className="text-muted-foreground">No video available</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button
          onClick={handleToggle}
          disabled={isPending}
          variant={completed ? "outline" : "default"}
          size="sm"
        >
          {completed ? (
            <>
              <XCircle className="mr-2 h-4 w-4" /> Mark incomplete
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" /> Mark complete
            </>
          )}
        </Button>
        {nextLessonId && completed && (
          <Button
            size="sm"
            onClick={() =>
              router.push(`/courses/${courseId}/lessons/${nextLessonId}`)
            }
          >
            Next lesson →
          </Button>
        )}
      </div>
    </div>
  );
}
