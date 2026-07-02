import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { Users, BookOpen, DollarSign, ShoppingCart } from "lucide-react";
import { RevenueChart } from "./_components/revenue-chart";

export default async function AdminPage() {
  const [userCount, courseCount, purchases] = await Promise.all([
    db.user.count(),
    db.course.count(),
    db.purchase.findMany({
      orderBy: { createdAt: "asc" },
      select: { amount: true, createdAt: true },
    }),
  ]);

  const totalRevenue = purchases.reduce((acc, p) => acc + p.amount, 0);

  const revenueByMonth = purchases.reduce<Record<string, number>>(
    (acc, p) => {
      const key = p.createdAt.toISOString().slice(0, 7);
      acc[key] = (acc[key] ?? 0) + p.amount;
      return acc;
    },
    {}
  );
  const chartData = Object.entries(revenueByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount: amount / 100 }));

  const stats = [
    {
      label: "Total users",
      value: userCount.toLocaleString(),
      icon: Users,
      color: "text-sky-600",
    },
    {
      label: "Total courses",
      value: courseCount.toLocaleString(),
      icon: BookOpen,
      color: "text-violet-600",
    },
    {
      label: "Total revenue",
      value: formatPrice(totalRevenue),
      icon: DollarSign,
      color: "text-emerald-600",
    },
    {
      label: "Total sales",
      value: purchases.length.toLocaleString(),
      icon: ShoppingCart,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Overview</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="mt-2 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <RevenueChart data={chartData} />
    </div>
  );
}
