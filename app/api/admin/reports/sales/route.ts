import { NextResponse, type NextRequest } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getCommerceSummary, listAdminOrders } from "@/lib/admin/commerce";
import { buildSalesReportPdf } from "@/lib/admin/report-pdf";
import { getAnalyticsSummary } from "@/lib/data/store";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const daysInput = Number(searchParams.get("days") ?? 30);
    const days = [7, 30, 90].includes(daysInput) ? daysInput : 30;

    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - (days - 1));

    const [summary, ordersResult, analytics] = await Promise.all([
      getCommerceSummary(days),
      listAdminOrders({ page: 1, limit: 100, since: since.toISOString() }),
      getAnalyticsSummary(days),
    ]);

    const pdf = await buildSalesReportPdf({
      summary,
      orders: ordersResult.orders,
      analytics,
      generatedAt: new Date(),
    });

    const filename = `solovyev-sales-report-${days}d-${new Date().toISOString().slice(0, 10)}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/reports/sales]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate report" },
      { status: 500 },
    );
  }
}
