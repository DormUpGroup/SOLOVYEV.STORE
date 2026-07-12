import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getAnalyticsSummary } from "@/lib/data/store";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const days = Number(searchParams.get("days") ?? 7);
  const summary = await getAnalyticsSummary(days);
  return NextResponse.json(summary);
}
