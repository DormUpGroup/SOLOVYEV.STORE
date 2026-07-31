import PDFDocument from "pdfkit";
import type { AdminOrderRow, CommerceSummary } from "@/lib/admin/commerce-types";
import { ORDER_STATUSES } from "@/lib/admin/commerce-types";
import type { AnalyticsSummary } from "@/lib/data/store";

const STATUS_LABELS: Record<string, string> = {
  pending_whatsapp: "Pending WhatsApp",
  in_chat: "In chat",
  paid: "Paid",
  shipped: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
};

export type SalesReportData = {
  summary: CommerceSummary;
  orders: AdminOrderRow[];
  analytics: AnalyticsSummary;
  generatedAt: Date;
};

/** Helvetica / WinAnsi-safe text for pdfkit standard fonts. */
function pdfText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[—–−]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/₪/g, "ILS ")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "?");
}

function money(amount: number, symbol: string): string {
  const rounded = Math.round(amount * 100) / 100;
  const prefix = symbol === "₪" || !symbol ? "ILS " : pdfText(symbol);
  return `${prefix}${rounded.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function drawSectionTitle(doc: PDFKit.PDFDocument, title: string) {
  doc.moveDown(0.8);
  doc.font("Helvetica-Bold").fontSize(13).fillColor("#111").text(pdfText(title));
  doc.moveDown(0.35);
  doc.font("Helvetica").fontSize(10).fillColor("#333");
}

export async function buildSalesReportPdf(data: SalesReportData): Promise<Buffer> {
  const { summary, orders, analytics, generatedAt } = data;
  const symbol = summary.currencySymbol || "₪";

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 48, bottom: 48, left: 48, right: 48 },
    autoFirstPage: true,
    bufferPages: true,
    info: {
      Title: `Solovyev Store Sales Report - ${summary.days}d`,
      Author: "Solovyev Store Admin",
    },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  try {
    doc.font("Helvetica-Bold").fontSize(18).fillColor("#111").text("SOLOVYEV STORE");
    doc.font("Helvetica").fontSize(12).fillColor("#555").text("Sales & operations report");
    doc.moveDown(0.4);
    doc.fontSize(10).fillColor("#333");
    doc.text(`Period: last ${summary.days} days`);
    doc.text(`Generated: ${generatedAt.toISOString().replace("T", " ").slice(0, 19)} UTC`);
    doc
      .fontSize(9)
      .fillColor("#777")
      .text("Order value = cart subtotal at checkout (not confirmed paid revenue).");

    drawSectionTitle(doc, "Summary");
    for (const line of [
      `Orders: ${summary.ordersCount}`,
      `Order value: ${money(summary.subtotalSum, symbol)}`,
      `Average order value: ${money(summary.averageOrderValue, symbol)}`,
    ]) {
      doc.text(pdfText(line));
    }

    drawSectionTitle(doc, "Orders by status");
    for (const status of ORDER_STATUSES) {
      doc.text(pdfText(`${STATUS_LABELS[status] ?? status}: ${summary.byStatus[status] ?? 0}`));
    }

    drawSectionTitle(doc, "Site engagement");
    doc.text(`Product views: ${analytics.views}`);
    doc.text(`Add to cart: ${analytics.cart}`);
    doc.text(`Begin checkout (WhatsApp): ${analytics.wa}`);
    doc.text(`Sell / trade submits: ${analytics.sell}`);

    drawSectionTitle(doc, "Top ordered products");
    if (!summary.topProducts.length) {
      doc.text("No products in this period.");
    } else {
      for (const [i, product] of summary.topProducts.entries()) {
        doc.text(
          pdfText(
            `${i + 1}. ${product.productTitle} - qty ${product.quantity}, ${money(product.subtotal, symbol)}`,
          ),
        );
      }
    }

    const activeDays = summary.dailyOrders.filter((d) => d.count > 0);
    drawSectionTitle(doc, "Daily activity (days with orders)");
    if (!activeDays.length) {
      doc.text("No orders in this period.");
    } else {
      for (const day of activeDays) {
        doc.text(pdfText(`${day.date}: ${day.count} order(s), ${money(day.subtotal, symbol)}`));
      }
    }

    drawSectionTitle(doc, `Orders (${orders.length} most recent)`);
    if (!orders.length) {
      doc.text("No orders in this period.");
    } else {
      for (const order of orders) {
        const customer = order.customerName || order.customerEmail || "-";
        doc.text(
          pdfText(
            `${order.orderRef} | ${formatDate(order.createdAt)} | ${STATUS_LABELS[order.status] ?? order.status} | ${money(order.subtotal, order.currencySymbol || symbol)} | ${customer}`,
          ),
        );
      }
    }

    doc.end();
  } catch (err) {
    try {
      doc.end();
    } catch {
      /* ignore cleanup errors */
    }
    throw err;
  }

  return done;
}
