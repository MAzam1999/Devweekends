"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, Tag, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const routes = [
  { icon: BarChart3, label: "Overview", href: "/admin" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: BookOpen, label: "Courses", href: "/admin/courses" },
  { icon: Tag, label: "Categories", href: "/admin/categories" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col overflow-y-auto border-r bg-slate-900 text-white">
      <div className="p-6">
        <Link href="/" className="text-xl font-bold text-white">
          LMS Admin
        </Link>
      </div>
      <div className="flex flex-col">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center gap-x-3 py-4 pl-6 text-sm font-medium text-slate-400 transition hover:text-white",
              (pathname === route.href ||
                (route.href !== "/admin" &&
                  pathname.startsWith(route.href))) &&
                "bg-white/10 text-white"
            )}
          >
            <route.icon className="h-5 w-5" />
            {route.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
