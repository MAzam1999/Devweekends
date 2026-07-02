"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";

interface Props {
  courseId: string;
  price: number | null;
  isLoggedIn: boolean;
}

export function EnrollButton({ courseId, price, isLoggedIn }: Props) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleEnroll() {
    if (!isLoggedIn) {
      router.push("/sign-in");
      return;
    }
    setIsPending(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to enroll");
      setIsPending(false);
    }
  }

  return (
    <Button
      className="w-full"
      onClick={handleEnroll}
      disabled={isPending}
    >
      {isPending
        ? "Redirecting..."
        : price
        ? `Enroll for ${formatPrice(price)}`
        : "Enroll for free"}
    </Button>
  );
}
