"use client";

import { useCallback, useEffect, useState } from "react";
import type { OrderStatus } from "@/lib/types";
import {
  ORDER_STATUSES,
  type CommerceSummary,
} from "@/lib/admin/commerce-types";
import styles from "@/app/admin/admin.module.css";

interface ReportingTabProps {
  showToast: (msg: string, ok?: boolean) => void;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_whatsapp: "Pending WhatsApp",
  in_chat: "In chat",
  paid: "Paid",
  shipped: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function ReportingTab({ showToast }: ReportingTabProps) {
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState<CommerceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/commerce/summary?days=${days}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load summary");
      setSummary(json);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load summary", false);
    } finally {
      setLoading(false);
    }
  }, [days, showToast]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/admin/reports/sales?days=${days}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to generate PDF");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="([^"]+)"/);
      a.href = url;
      a.download = match?.[1] ?? `solovyev-sales-report-${days}d.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast("PDF report downloaded");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to download PDF", false);
    } finally {
      setDownloading(false);
    }
  };

  const symbol = summary?.currencySymbol ?? "₪";

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.segmentedControl}>
          {[7, 30, 90].map((value) => (
            <button
              key={value}
              type="button"
              className={`${styles.segmentedBtn} ${days === value ? styles.segmentedBtnActive : ""}`}
              onClick={() => setDays(value)}
            >
              {value} days
            </button>
          ))}
        </div>
        <button type="button" className={styles.btn} onClick={() => void loadSummary()} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={() => void downloadPdf()}
          disabled={downloading}
        >
          {downloading ? "Generating…" : "Download PDF"}
        </button>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <h3>Sales report</h3>
          <span className={styles.hint}>
            Preview of the last {days} days — download PDF for a printable copy
          </span>
        </div>
        <div className={styles.panelBody}>
          <p style={{ margin: "0 0 12px", color: "var(--adm-muted)", fontSize: 14 }}>
            Includes order counts, paid revenue, status breakdown, top sold products, daily activity,
            recent orders, and site engagement. Revenue counts only orders marked Paid.
          </p>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statLabel}>All orders ({days} days)</div>
          <div className={styles.statValue}>{summary?.ordersCount ?? "—"}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Revenue (paid)</div>
          <div className={styles.statValue}>
            {summary ? `${symbol}${Math.round(summary.revenueSum)}` : "—"}
          </div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Average paid order</div>
          <div className={styles.statValue}>
            {summary ? `${symbol}${Math.round(summary.averageOrderRevenue)}` : "—"}
          </div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Products sold (paid)</div>
          <div className={styles.statValue}>{summary?.topProducts.length ?? "—"}</div>
        </div>
      </div>

      <div className={styles.stats}>
        {ORDER_STATUSES.map((key) => (
          <div className={styles.stat} key={key}>
            <div className={styles.statLabel}>{STATUS_LABELS[key]}</div>
            <div className={styles.statValue}>{summary?.byStatus[key] ?? 0}</div>
          </div>
        ))}
      </div>

      {summary && summary.topProducts.length > 0 ? (
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3>Top sold products (paid) ({days} days)</h3>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {summary.topProducts.map((product) => (
                  <tr key={product.productSlug || String(product.productId)}>
                    <td>{product.productTitle}</td>
                    <td>{product.quantity}</td>
                    <td>
                      {symbol}
                      {Math.round(product.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </>
  );
}
