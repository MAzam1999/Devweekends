import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { AdminSidebar } from "./_components/admin-sidebar";
import { AdminNavbar } from "./_components/admin-navbar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("admin");

  return (
    <div className="h-full">
      <div className="fixed inset-y-0 z-50 h-[80px] w-full md:pl-64">
        <AdminNavbar />
      </div>
      <div className="fixed inset-y-0 z-50 hidden h-full w-64 flex-col md:flex">
        <AdminSidebar />
      </div>
      <main className="h-full pt-[80px] md:pl-64">{children}</main>
    </div>
  );
}
