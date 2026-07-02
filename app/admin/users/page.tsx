import { db } from "@/lib/db";
import { UserTable } from "./_components/user-table";

export default async function AdminUsersPage() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { purchases: true, courses: true } },
    },
  });

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Users ({users.length})</h1>
      <UserTable users={users} />
    </div>
  );
}
