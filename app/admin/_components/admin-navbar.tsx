import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function AdminNavbar() {
  return (
    <nav className="flex h-full items-center border-b bg-white px-6 shadow-sm">
      <Link href="/courses" className="text-sm text-muted-foreground hover:text-primary">
        ← Student view
      </Link>
      <div className="ml-auto">
        <UserButton />
      </div>
    </nav>
  );
}
