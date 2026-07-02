"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon, Pencil, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateCourse } from "../../actions";

interface Props {
  courseId: string;
  imageUrl: string | null;
}

export function ImageUpload({ courseId, imageUrl }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsPending(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("courseId", courseId);

      const res = await fetch("/api/upload/thumbnail", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const result = await updateCourse({ courseId, imageUrl: data.url });
      if (result?.error) throw new Error(result.error);

      toast.success("Image updated!");
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Course thumbnail</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? (
            "Cancel"
          ) : imageUrl ? (
            <>
              <Pencil className="mr-1 h-3 w-3" /> Change
            </>
          ) : (
            <>
              <PlusCircle className="mr-1 h-3 w-3" /> Add image
            </>
          )}
        </Button>
      </div>

      {isEditing ? (
        <div className="mt-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={isPending}
            className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            16:9 ratio recommended
          </p>
        </div>
      ) : imageUrl ? (
        <div className="relative mt-4 aspect-video">
          <Image
            src={imageUrl}
            alt="Course thumbnail"
            fill
            className="rounded-md object-cover"
          />
        </div>
      ) : (
        <div className="mt-4 flex aspect-video items-center justify-center rounded-md border-2 border-dashed">
          <ImageIcon className="h-10 w-10 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
