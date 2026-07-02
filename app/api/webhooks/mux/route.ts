import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const type: string = body.type;

  if (type === "video.asset.ready") {
    const assetId: string = body.data.id;
    const playbackId: string | undefined = body.data.playback_ids?.[0]?.id;
    const lessonId: string | undefined = body.data.passthrough;

    if (!lessonId || !playbackId) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    await db.lesson.update({
      where: { id: lessonId },
      data: { muxAssetId: assetId, muxPlaybackId: playbackId },
    });
  }

  if (type === "video.asset.errored") {
    const lessonId: string | undefined = body.data.passthrough;
    if (lessonId) {
      await db.lesson.update({
        where: { id: lessonId },
        data: { muxAssetId: null },
      });
    }
  }

  return NextResponse.json({ received: true });
}
