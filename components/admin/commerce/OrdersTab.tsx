"use client";

import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { OrderStatus } from "@/lib/types";
import {
  ORDER_STATUSES,
  type AdminOrderDetail,
  type AdminOrderRow,
  type CommerceSummary,
} from "@/lib/admin/commerce-types";
import { OrderStatusBadge } from "@/components/admin/commerce/OrderStatusBadge";
import { buildAdminOrderReplyMessage } from "@/lib/whatsapp";
import { ADMIN_CHART_COLORS, adminLineChartOptions } from "@/lib/admin/chart-theme";
import styles from "@/app/admin/admin.module.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

interface OrdersTabProps {
  showToast: (msg: string, ok?: boolean) => void;
}

const STATUS_LABELS: Record<OrderStatus | "", string> = {
  "": "All statuses",
  pending_whatsapp: "Pending WhatsApp",
  in_chat: "In chat",
  paid: "Paid",
  shipped: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function OrdersTab({ showToast }: OrdersTabProps) {
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState<CommerceSummary | null>(null);
  const [selected, setSelected] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailBusy, setDetailBusy] = useState(false);
  const limit = 25;

  const loadSummary = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/commerce/summary?days=${days}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load summary");
      setSummary(json);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load summary", false);
    }
  }, [days, showToast]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      const res = await fetch(`/api/admin/orders?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load orders");
      setOrders(json.orders ?? []);
      setTotal(json.total ?? 0);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load orders", false);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, showToast]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const openOrder = async (id: string) => {
    setDetailBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load order");
      setSelected(json.order);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load order", false);
    } finally {
      setDetailBusy(false);
    }
  };

  const updateStatus = async (nextStatus: OrderStatus) => {
    if (!selected) return;
    setDetailBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update status");
      setSelected(json.order);
      showToast(`Order ${json.order.orderRef} → ${nextStatus}`);
      await Promise.all([loadOrders(), loadSummary()]);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update status", false);
    } finally {
      setDetailBusy(false);
    }
  };

  const copyText = async (text: string, okMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(okMessage);
    } catch {
      showToast("Could not copy to clipboard", false);
    }
  };

  const chartData = useMemo(() => {
    if (!summary) return null;
    return {
      labels: summary.dailyOrders.map((d) =>
        new Date(d.date).toLocaleDateString("en", { day: "numeric", month: "short" }),
      ),
      datasets: [
        {
          label: "Orders",
          data: summary.dailyOrders.map((d) => d.count),
          borderColor: ADMIN_CHART_COLORS.primary,
          backgroundColor: "rgba(10, 132, 255, 0.08)",
          tension: 0.35,
        },
        {
          label: "Paid revenue",
          data: summary.dailyOrders.map((d) => d.revenue),
          borderColor: ADMIN_CHART_COLORS.success,
          backgroundColor: "rgba(48, 209, 88, 0.08)",
          tension: 0.35,
          yAxisID: "y1",
        },
      ],
    };
  }, [summary]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
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
        <button
          type="button"
          className={styles.btn}
          onClick={() => {
            void loadOrders();
            void loadSummary();
          }}
        >
          Refresh
        </button>
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
          <div className={styles.statLabel}>Pending WhatsApp</div>
          <div className={styles.statValue}>{summary?.byStatus.pending_whatsapp ?? 0}</div>
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

      {chartData ? (
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3>Orders over time</h3>
            <span className={styles.hint}>Only orders marked Paid count toward revenue</span>
          </div>
          <div className={styles.panelBody} style={{ height: 280 }}>
            <Line data={chartData} options={adminLineChartOptions()} />
          </div>
        </div>
      ) : null}

      {summary && summary.topProducts.length > 0 ? (
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3>Top ordered products ({days}d)</h3>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {summary.topProducts.map((product) => (
                  <tr key={product.productSlug + String(product.productId)}>
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

      <div className={styles.toolbar}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setSearch(searchInput.trim());
          }}
          style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: 1 }}
        >
          <input
            className={styles.input}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search order ref or email"
            style={{ minWidth: 220 }}
          />
          <select
            className={styles.input}
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value as OrderStatus | "");
            }}
          >
            {(["", ...ORDER_STATUSES] as const).map((value) => (
              <option key={value || "all"} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
          <button type="submit" className={styles.btn}>
            Filter
          </button>
        </form>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <h3>Orders</h3>
          {loading ? <span className={styles.hint}>Loading…</span> : null}
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Ref</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Items</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <span className={styles.hint}>No orders found.</span>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => void openOrder(order.id)}
                  >
                    <td>{order.orderRef}</td>
                    <td>{new Date(order.createdAt).toLocaleString()}</td>
                    <td>
                      {order.customerEmail || "—"}
                      {order.customerName ? (
                        <div className={styles.hint}>{order.customerName}</div>
                      ) : null}
                    </td>
                    <td>
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td>{order.itemCount}</td>
                    <td>
                      {order.currencySymbol}
                      {order.subtotal.toFixed(0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className={styles.panelBody} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            className={styles.btn}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span className={styles.hint}>
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            className={styles.btn}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {(selected || detailBusy) && (
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3>Order detail</h3>
            <button type="button" className={styles.btn} onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
          <div className={styles.panelBody}>
            {!selected ? (
              <p className={styles.hint}>Loading…</p>
            ) : (
              <>
                <p>
                  <strong>{selected.orderRef}</strong> ·{" "}
                  {new Date(selected.createdAt).toLocaleString()}
                </p>
                <p className={styles.hint}>
                  {selected.customerEmail || "Unknown customer"}
                  {selected.customerName ? ` · ${selected.customerName}` : ""}
                  {selected.customerPhone ? ` · ${selected.customerPhone}` : ""}
                </p>
                <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "12px 0", flexWrap: "wrap" }}>
                  <OrderStatusBadge status={selected.status} />
                  <select
                    className={styles.input}
                    value={selected.status}
                    disabled={detailBusy}
                    onChange={(event) => void updateStatus(event.target.value as OrderStatus)}
                  >
                    {ORDER_STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {STATUS_LABELS[value]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className={styles.btn}
                    onClick={() =>
                      void copyText(
                        selected.orderRef,
                        `Copied ${selected.orderRef} — paste into WhatsApp search`,
                      )
                    }
                  >
                    Copy order ref
                  </button>
                  <button
                    type="button"
                    className={styles.btn}
                    onClick={() =>
                      void copyText(
                        buildAdminOrderReplyMessage({
                          orderRef: selected.orderRef,
                          itemTitles: selected.items.map((item) => item.productTitle),
                          customerName: selected.customerName,
                        }),
                        "Reply copied — paste into the WhatsApp chat",
                      )
                    }
                  >
                    Copy reply
                  </button>
                  {selected.customerChatUrl ? (
                    <a
                      className={styles.btn}
                      href={selected.customerChatUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Go to chat
                    </a>
                  ) : null}
                </div>
                <p className={styles.hint} style={{ marginTop: 0 }}>
                  Find chat: WhatsApp search → paste order ref (after customer sent the order).
                </p>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Size</th>
                        <th>Qty</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.productTitle}</td>
                          <td>{item.size || "—"}</td>
                          <td>{item.quantity}</td>
                          <td>
                            {selected.currencySymbol}
                            {(item.unitPrice * item.quantity).toFixed(0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p style={{ marginTop: 12 }}>
                  <strong>
                    Subtotal: {selected.currencySymbol}
                    {selected.subtotal.toFixed(0)}
                  </strong>
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
