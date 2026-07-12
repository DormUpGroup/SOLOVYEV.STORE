import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { revalidateStore } from "@/lib/admin-api";
import { createServiceClient } from "@/utils/supabase/admin";
import { normalizeStoreConfig } from "@/lib/store-config";
import type { StoreConfig } from "@/lib/types";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("store_config")
    .select("data")
    .eq("id", 1)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const raw = (data as { data?: StoreConfig } | null)?.data;
  return NextResponse.json({ config: normalizeStoreConfig(raw) });
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as { config: StoreConfig };
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("store_config")
    .upsert({ id: 1, data: body.config })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateStore();
  return NextResponse.json({ config: (data as { data: StoreConfig }).data });
}
