import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { BookOpen } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function CourseNavbar() {
  const { userId } = await auth();
  let isTeacher = false;
  if (userId) {
    const user = await db.user.findUnique({ where: { clerkId: userId } });
    isTeacher = user?.role === "instructor" || user?.role === "admin";
  }

  return (
    <nav className="flex h-full items-center border-b bg-white px-6 shadow-sm">
      <Link href="/courses" className="flex items-center gap-2 font-bold text-primary">
        <BookOpen className="h-5 w-5" />
        LMS Platform
      </Link>
      <div className="ml-auto flex items-center gap-4">
        {isTeacher && (
          <Link
            href="/teacher/courses"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Teacher
          </Link>
        )}
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          My Learning
        </Link>
        <UserButton />
      </div>
    </nav>
  );
}
