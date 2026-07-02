import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { mux } from "@/lib/mux";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

const schema = z.object({
  lessonId: z.string(),
  courseId: z.string(),
});

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { lessonId, courseId } = parsed.data;

  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
  if (course.instructorId !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const upload = await mux.video.uploads.create({
    cors_origin: process.env.NEXT_PUBLIC_APP_URL ?? "*",
    new_asset_settings: {
      playback_policy: ["signed"],
      passthrough: lessonId,
    },
  });

  return NextResponse.json({ uploadUrl: upload.url, assetId: upload.id });
}
