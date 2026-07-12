import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
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

  await supabase.from("faq_items").delete().neq("id", 0);

  const rows = body.items.map((item, i) => ({
    sort_order: i,
    question: item.question,
    answer: item.answer,
  }));

  const { data, error } = await supabase.from("faq_items").insert(rows).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}
