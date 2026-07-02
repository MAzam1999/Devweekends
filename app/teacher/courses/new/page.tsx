import { redirect } from "next/navigation";
import { CreateCourseForm } from "./_components/create-course-form";
import { requireAuth } from "@/lib/auth";

export default async function NewCoursePage() {
  await requireAuth();
  return (
    <div className="mx-auto flex h-full max-w-5xl items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Name your course</h1>
        <p className="text-sm text-muted-foreground">
          What would you like to call your course? Don&apos;t worry, you can
          change this later.
        </p>
        <CreateCourseForm />
      </div>
    </div>
  );
}
