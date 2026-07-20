import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { revalidateStore } from "@/lib/admin-api";
import { createServiceClient } from "@/utils/supabase/admin";
import type { FaqItem } from "@/lib/types";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("faq_items")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as {
    items: Array<FaqItem & { id?: number; sort_order?: number }>;
  };
  const supabase = createServiceClient();

  const { data: existing, error: existingError } = await supabase
    .from("faq_items")
    .select("id");
  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const rows = body.items.map((item, i) => ({
    sort_order: i,
    question: item.question,
    answer: item.answer,
  }));

  // Insert first so a failure keeps the previous FAQ intact
  const { data, error } =
    rows.length > 0
      ? await supabase.from("faq_items").insert(rows).select()
      : { data: [] as FaqItem[], error: null };

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const oldIds = (existing ?? []).map((row) => row.id as number);
  if (oldIds.length > 0) {
    const { error: deleteError } = await supabase.from("faq_items").delete().in("id", oldIds);
    if (deleteError) {
      // New rows exist; best-effort cleanup already done for old — report soft failure
      console.error("[PUT /api/admin/faq] failed to remove old rows:", deleteError);
    }
  }

  revalidateStore();
  return NextResponse.json({ items: data ?? [] });
}
