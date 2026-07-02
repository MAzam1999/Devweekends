import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { TeacherNavbar } from "./_components/teacher-navbar";
import { TeacherSidebar } from "./_components/teacher-sidebar";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  if (user.role !== "instructor" && user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="h-full">
      <div className="fixed inset-y-0 z-50 h-[80px] w-full md:pl-56">
        <TeacherNavbar />
      </div>
      <div className="fixed inset-y-0 z-50 hidden h-full w-56 flex-col md:flex">
        <TeacherSidebar />
      </div>
      <main className="h-full pt-[80px] md:pl-56">{children}</main>
    </div>
  );
}
