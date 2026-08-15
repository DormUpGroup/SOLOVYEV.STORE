import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getGaOverview } from "@/lib/analytics/ga4";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const days = Number(searchParams.get("days") ?? 7);
  const overview = await getGaOverview(days);
  return NextResponse.json(overview);
}
