import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { productToDbRow } from "@/lib/data/store";
import { extractShortcode, parseInstagramPost } from "@/lib/instagram/parsePost";
import { createServiceClient } from "@/utils/supabase/admin";

/**
 * Manual Instagram import — paste post URL + caption + image URL.
 * Full auto-fetch requires INSTAGRAM_ACCESS_TOKEN (phase 2 cron).
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    url?: string;
    caption?: string;
    imageUrl?: string;
  };

  const shortcode = body.url ? extractShortcode(body.url) : null;
  if (!shortcode || !body.caption || !body.imageUrl) {
    return NextResponse.json(
      { error: "url, caption, and imageUrl required" },
      { status: 400 },
    );
  }

  const parsed = parseInstagramPost({
    shortcode,
    caption: body.caption,
    imageUrl: body.imageUrl,
  });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("products")
    .insert(productToDbRow(parsed))
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ product: data, draft: true });
}
