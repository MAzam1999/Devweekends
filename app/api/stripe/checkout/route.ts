import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

const schema = z.object({ courseId: z.string() });

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const course = await db.course.findUnique({
    where: { id: parsed.data.courseId, isPublished: true },
  });
  if (!course || !course.price) {
    return NextResponse.json({ error: "Course not available" }, { status: 404 });
  }

  const alreadyPurchased = await db.purchase.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: course.id } },
  });
  if (alreadyPurchased) {
    return NextResponse.json({ error: "Already purchased" }, { status: 400 });
  }

  let stripeCustomer = await db.stripeCustomer.findUnique({
    where: { userId: user.id },
  });
  if (!stripeCustomer) {
    const customer = await stripe.customers.create({ email: user.email });
    stripeCustomer = await db.stripeCustomer.create({
      data: { userId: user.id, stripeCustomerId: customer.id },
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomer.stripeCustomerId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          product_data: {
            name: course.title,
            description: course.description ?? undefined,
            images: course.imageUrl ? [course.imageUrl] : [],
          },
          unit_amount: course.price,
        },
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${course.id}?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${course.id}?canceled=1`,
    metadata: { courseId: course.id, userId: user.id },
  });

  return NextResponse.json({ url: session.url });
}
