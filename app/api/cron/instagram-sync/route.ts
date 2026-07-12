import { NextResponse } from "next/server";

/**
 * Instagram Graph API sync — requires INSTAGRAM_ACCESS_TOKEN + INSTAGRAM_USER_ID.
 * Configure Vercel Cron to POST here with Authorization: Bearer CRON_SECRET.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;

  if (!token || !userId) {
    return NextResponse.json({
      ok: false,
      message: "Set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_USER_ID to enable auto-sync",
    });
  }

  // Phase 2: fetch media from Graph API, parse captions, insert drafts
  return NextResponse.json({
    ok: true,
    synced: 0,
    message: "Cron endpoint ready — wire Graph API fetch in production",
  });
}
