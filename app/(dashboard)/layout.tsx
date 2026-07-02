import { CourseNavbar } from "@/app/(course)/_components/course-navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full">
      <div className="fixed inset-x-0 top-0 z-50 h-[80px]">
        <CourseNavbar />
      </div>
      <main className="pt-[80px]">{children}</main>
    </div>
  );
}
