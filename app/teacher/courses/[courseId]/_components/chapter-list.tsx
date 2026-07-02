"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, GripVertical, Pencil, Plus, Trash } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  createChapter,
  deleteChapter,
  reorderChapters,
  createLesson,
  deleteLesson,
  reorderLessons,
} from "../chapters/actions";
import type { Chapter, Lesson } from "@prisma/client";
import { ConfirmModal } from "@/components/confirm-modal";

type ChapterWithLessons = Chapter & { lessons: Lesson[] };

interface Props {
  courseId: string;
  chapters: ChapterWithLessons[];
}

export function ChapterList({ courseId, chapters: initialChapters }: Props) {
  const [chapters, setChapters] = useState(initialChapters);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleChapterDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = chapters.findIndex((c) => c.id === active.id);
    const newIndex = chapters.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(chapters, oldIndex, newIndex).map((c, i) => ({
      ...c,
      position: i + 1,
    }));
    setChapters(reordered);
    await reorderChapters(
      courseId,
      reordered.map((c) => ({ id: c.id, position: c.position }))
    );
  }

  async function handleAddChapter() {
    if (!newChapterTitle.trim()) return;
    setIsPending(true);
    try {
      const result = await createChapter(courseId, newChapterTitle.trim());
      if (result?.chapter) {
        setChapters((prev) => [...prev, { ...result.chapter, lessons: [] }]);
      }
      setNewChapterTitle("");
      setIsAddingChapter(false);
      toast.success("Chapter created!");
    } catch {
      toast.error("Failed to create chapter");
    } finally {
      setIsPending(false);
    }
  }

  async function handleDeleteChapter(chapterId: string) {
    setIsPending(true);
    try {
      await deleteChapter(courseId, chapterId);
      setChapters((prev) => prev.filter((c) => c.id !== chapterId));
      toast.success("Chapter deleted");
    } catch {
      toast.error("Failed to delete chapter");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Chapters & Lessons</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsAddingChapter(!isAddingChapter)}
        >
          <Plus className="mr-1 h-3 w-3" />
          Add Chapter
        </Button>
      </div>

      {isAddingChapter && (
        <div className="mt-3 flex gap-2">
          <Input
            value={newChapterTitle}
            onChange={(e) => setNewChapterTitle(e.target.value)}
            placeholder="Chapter title"
            onKeyDown={(e) => e.key === "Enter" && handleAddChapter()}
            disabled={isPending}
          />
          <Button size="sm" onClick={handleAddChapter} disabled={isPending}>
            Add
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsAddingChapter(false)}
          >
            Cancel
          </Button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleChapterDragEnd}
      >
        <SortableContext
          items={chapters.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="mt-4 space-y-2">
            {chapters.map((chapter) => (
              <SortableChapter
                key={chapter.id}
                courseId={courseId}
                chapter={chapter}
                onDelete={() => handleDeleteChapter(chapter.id)}
                onLessonsChange={(lessons) =>
                  setChapters((prev) =>
                    prev.map((c) =>
                      c.id === chapter.id ? { ...c, lessons } : c
                    )
                  )
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableChapter({
  courseId,
  chapter,
  onDelete,
  onLessonsChange,
}: {
  courseId: string;
  chapter: ChapterWithLessons;
  onDelete: () => void;
  onLessonsChange: (lessons: Lesson[]) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-md border bg-background">
      <div className="flex items-center gap-2 p-3">
        <button {...attributes} {...listeners} className="cursor-grab">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <button
          className="flex flex-1 items-center gap-2 text-left"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <span className="text-sm font-medium">{chapter.title}</span>
          <Badge variant={chapter.isPublished ? "default" : "secondary"} className="ml-auto">
            {chapter.isPublished ? "Published" : "Draft"}
          </Badge>
        </button>
        <ConfirmModal onConfirm={onDelete}>
          <Button variant="ghost" size="sm">
            <Trash className="h-3 w-3" />
          </Button>
        </ConfirmModal>
      </div>

      {expanded && (
        <div className="border-t p-3">
          <LessonList
            courseId={courseId}
            chapterId={chapter.id}
            lessons={chapter.lessons}
            onLessonsChange={onLessonsChange}
          />
        </div>
      )}
    </div>
  );
}

function LessonList({
  courseId,
  chapterId,
  lessons: initialLessons,
  onLessonsChange,
}: {
  courseId: string;
  chapterId: string;
  lessons: Lesson[];
  onLessonsChange: (lessons: Lesson[]) => void;
}) {
  const [lessons, setLessons] = useState(initialLessons);
  const [newTitle, setNewTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  function sync(updated: Lesson[]) {
    setLessons(updated);
    onLessonsChange(updated);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = lessons.findIndex((l) => l.id === active.id);
    const newIdx = lessons.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(lessons, oldIdx, newIdx).map((l, i) => ({
      ...l,
      position: i + 1,
    }));
    sync(reordered);
    await reorderLessons(
      courseId,
      reordered.map((l) => ({ id: l.id, position: l.position }))
    );
  }

  async function handleAdd() {
    if (!newTitle.trim()) return;
    setIsPending(true);
    try {
      const result = await createLesson(courseId, chapterId, newTitle.trim());
      if (result?.lesson) {
        sync([...lessons, result.lesson]);
      }
      setNewTitle("");
      setIsAdding(false);
      toast.success("Lesson created!");
    } catch {
      toast.error("Failed to create lesson");
    } finally {
      setIsPending(false);
    }
  }

  async function handleDelete(lessonId: string) {
    setIsPending(true);
    try {
      await deleteLesson(courseId, lessonId);
      sync(lessons.filter((l) => l.id !== lessonId));
      toast.success("Lesson deleted");
    } catch {
      toast.error("Failed to delete lesson");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-1">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={lessons.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {lessons.map((lesson) => (
            <SortableLesson
              key={lesson.id}
              courseId={courseId}
              lesson={lesson}
              onDelete={() => handleDelete(lesson.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {isAdding ? (
        <div className="mt-2 flex gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Lesson title"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            disabled={isPending}
          />
          <Button size="sm" onClick={handleAdd} disabled={isPending}>
            Add
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsAdding(true)}
          className="mt-1 text-xs"
        >
          <Plus className="mr-1 h-3 w-3" />
          Add Lesson
        </Button>
      )}
    </div>
  );
}

function SortableLesson({
  courseId,
  lesson,
  onDelete,
}: {
  courseId: string;
  lesson: Lesson;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded p-2 text-sm hover:bg-muted"
    >
      <button {...attributes} {...listeners} className="cursor-grab">
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </button>
      <span className="flex-1 truncate">{lesson.title}</span>
      {lesson.isFree && (
        <Badge variant="outline" className="text-xs">
          Free
        </Badge>
      )}
      <Badge variant={lesson.isPublished ? "default" : "secondary"} className="text-xs">
        {lesson.isPublished ? "Published" : "Draft"}
      </Badge>
      <a
        href={`/teacher/courses/${courseId}/lessons/${lesson.id}`}
        className="inline-flex h-7 w-7 items-center justify-center rounded-[min(var(--radius-md),12px)] text-sm hover:bg-muted"
      >
        <Pencil className="h-3 w-3" />
      </a>
      <ConfirmModal onConfirm={onDelete}>
        <Button variant="ghost" size="sm">
          <Trash className="h-3 w-3" />
        </Button>
      </ConfirmModal>
    </div>
  );
}
