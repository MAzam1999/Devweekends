"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LayoutDashboard, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const routes = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/teacher/courses",
  },
  {
    icon: BookOpen,
    label: "Courses",
    href: "/teacher/courses",
  },
];

export function TeacherSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col overflow-y-auto border-r bg-white shadow-sm">
      <div className="p-6">
        <Link href="/" className="text-xl font-bold text-primary">
          LMS
        </Link>
      </div>
      <div className="flex flex-col w-full">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center gap-x-2 text-slate-500 text-sm font-medium pl-6 transition-all hover:text-slate-600 hover:bg-slate-300/20",
              "h-full py-4",
              pathname === route.href &&
                "text-sky-700 bg-sky-200/20 hover:bg-sky-200/20 hover:text-sky-700"
            )}
          >
            <route.icon className="h-5 w-5" />
            {route.label}
          </Link>
        ))}
      </div>
      <div className="mt-auto p-6">
        <Link
          href="/teacher/courses/new"
          className="flex items-center gap-x-2 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <PlusCircle className="h-5 w-5" />
          New Course
        </Link>
      </div>
    </div>
  );
}
