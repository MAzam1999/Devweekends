import { AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BannerProps {
  label: string;
  variant?: "warning" | "success";
}

export function Banner({ label, variant = "warning" }: BannerProps) {
  return (
    <div
      className={cn(
        "mb-4 flex items-center gap-x-2 rounded-md border p-4 text-sm font-medium",
        variant === "warning" &&
          "border-yellow-300 bg-yellow-200/80 text-yellow-800",
        variant === "success" &&
          "border-emerald-300 bg-emerald-200/80 text-emerald-800"
      )}
    >
      {variant === "warning" ? (
        <AlertTriangle className="h-4 w-4" />
      ) : (
        <CheckCircle className="h-4 w-4" />
      )}
      {label}
    </div>
  );
}
