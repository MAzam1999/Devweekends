import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function TeacherNavbar() {
  return (
    <nav className="flex h-full items-center border-b bg-white px-6 shadow-sm">
      <div className="flex items-center gap-x-2">
        <Link href="/courses" className="text-sm text-muted-foreground hover:text-primary">
          Student View
        </Link>
      </div>
      <div className="ml-auto flex items-center gap-x-4">
        <UserButton />
      </div>
    </nav>
  );
}
