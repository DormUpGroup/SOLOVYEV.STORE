"use client";

import {
  ArcElement,
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
import type { FaqItem, Product, StoreConfig } from "@/lib/types";
import type { GaOverview } from "@/lib/analytics/ga-types";
import { normalizeStoreConfig } from "@/lib/store-config";
import { GaPanel } from "@/components/admin/legacy/GaPanel";
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
  ArcElement,
);

interface LegacyTabsProps {
  tab: "overview" | "faq" | "settings" | "analytics";
  products: Product[];
  onDirtyChange: (dirty: boolean) => void;
  showToast: (msg: string, ok?: boolean) => void;
}

export function LegacyTabs({ tab, products, onDirtyChange, showToast }: LegacyTabsProps) {
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [faq, setFaq] = useState<Array<FaqItem & { id?: number }>>([]);
  const [analytics, setAnalytics] = useState<{
    views: number;
    cart: number;
    wa: number;
    sell: number;
    byProduct: Record<number, { views: number; cart: number; wa: number }>;
    recent: Array<{ event_type: string; product_id: number | null; created_at: string }>;
  } | null>(null);
  const [chartDays, setChartDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [ga, setGa] = useState<GaOverview | null>(null);

  const loadLegacy = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, fRes, aRes, gRes] = await Promise.all([
        fetch("/api/admin/config"),
        fetch("/api/admin/faq"),
        fetch(`/api/admin/analytics?days=${chartDays}`),
        fetch(`/api/admin/analytics/ga?days=${chartDays}`),
      ]);
      const cJson = await cRes.json();
      const fJson = await fRes.json();
      const aJson = await aRes.json();
      const gJson = (await gRes.json()) as GaOverview;
      setConfig(normalizeStoreConfig(cJson.config));
      setFaq(fJson.items ?? []);
      setAnalytics(aJson);
      setGa(gJson);
    } catch {
      showToast("Failed to load data", false);
    } finally {
      setLoading(false);
    }
  }, [chartDays, showToast]);

  useEffect(() => {
    loadLegacy();
  }, [loadLegacy]);

  const publishSite = async () => {
    await fetch("/api/admin/publish", { method: "POST" });
  };

  const saveFaq = async () => {
    const res = await fetch("/api/admin/faq", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: faq }),
    });
    if (!res.ok) {
      showToast("FAQ save failed", false);
      return;
    }
    await publishSite();
    onDirtyChange(false);
    showToast("FAQ saved — live on site");
  };

  const saveConfig = async () => {
    if (!config) return;
    const res = await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config }),
    });
    if (!res.ok) {
      showToast("Settings save failed", false);
      return;
    }
    await publishSite();
    onDirtyChange(false);
    showToast("Settings saved — live on site");
  };

  const uploadImage = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    if (!res.ok) {
      showToast("Upload failed", false);
      return null;
    }
    const json = await res.json();
    return (json.url ?? json.urls?.[0]) as string;
  };

  const stats = useMemo(() => {
    const available = products.filter(
      (p) => p.status === "available" || p.status === "new_drop",
    ).length;
    const sold = products.filter((p) => p.status === "sold").length;
    const reserved = products.filter((p) => p.status === "reserved").length;
    return { available, sold, reserved, total: products.length };
  }, [products]);

  const chartData = useMemo(() => {
    if (!analytics) return null;
    const labels: string[] = [];
    const views: number[] = [];
    const carts: number[] = [];
    const was: number[] = [];
    for (let i = chartDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      labels.push(d.toLocaleDateString("en", { day: "numeric", month: "short" }));
      const dayEvents = analytics.recent.filter((e) => e.created_at.slice(0, 10) === key);
      views.push(dayEvents.filter((e) => e.event_type === "view_item").length);
      carts.push(dayEvents.filter((e) => e.event_type === "add_to_cart").length);
      was.push(dayEvents.filter((e) => e.event_type === "begin_checkout").length);
    }
    return {
      labels,
      datasets: [
        { label: "Views", data: views, borderColor: ADMIN_CHART_COLORS.primary, tension: 0.35 },
        { label: "Cart", data: carts, borderColor: "#bf5af2", tension: 0.35 },
        { label: "WhatsApp", data: was, borderColor: ADMIN_CHART_COLORS.success, tension: 0.35 },
      ],
    };
  }, [analytics, chartDays]);

  if (loading && !config) {
    return <p className={styles.hint}>Loading…</p>;
  }

  if (tab === "overview") {
    return (
      <>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statLabel}>Available</div>
            <div className={styles.statValue}>{stats.available}</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statLabel}>Reserved</div>
            <div className={styles.statValue}>{stats.reserved}</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statLabel}>Sold</div>
            <div className={styles.statValue}>{stats.sold}</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statLabel}>WhatsApp 7d</div>
            <div className={styles.statValue}>{analytics?.wa ?? 0}</div>
          </div>
        </div>
        <GaPanel data={ga} compact />
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3>Recent activity</h3>
          </div>
          <div className={styles.panelBody}>
            {(analytics?.recent ?? []).length === 0 ? (
              <p className={styles.hint}>No events yet.</p>
            ) : (
              analytics?.recent.map((e, i) => (
                <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {e.event_type} {e.product_id ? `#${e.product_id}` : ""}{" "}
                  <span className={styles.hint}>{new Date(e.created_at).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </>
    );
  }

  if (tab === "faq" && config) {
    return (
      <>
        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.btn}
            onClick={() => setFaq((prev) => [...prev, { question: "", answer: "" }])}
          >
            + Add FAQ
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={saveFaq}>
            Save FAQ
          </button>
        </div>
        <div className={styles.panel}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Question</th>
                  <th>Answer</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {faq.map((item, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>
                      <input
                        value={item.question}
                        onChange={(e) => {
                          const next = [...faq];
                          next[i] = { ...item, question: e.target.value };
                          setFaq(next);
                          onDirtyChange(true);
                        }}
                      />
                    </td>
                    <td>
                      <textarea
                        rows={2}
                        value={item.answer}
                        onChange={(e) => {
                          const next = [...faq];
                          next[i] = { ...item, answer: e.target.value };
                          setFaq(next);
                          onDirtyChange(true);
                        }}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnDanger}`}
                        onClick={() => setFaq((prev) => prev.filter((_, j) => j !== i))}
                      >
                        Del
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  }

  if (tab === "settings" && config) {
    return (
      <>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3>Contacts</h3>
          </div>
          <div className={styles.panelBody}>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>Store name</label>
                <input
                  value={config.storeName}
                  onChange={(e) => {
                    setConfig({ ...config, storeName: e.target.value });
                    onDirtyChange(true);
                  }}
                />
              </div>
              <div className={styles.field}>
                <label>WhatsApp phone</label>
                <input
                  value={config.contacts.whatsappPhone}
                  onChange={(e) => {
                    setConfig({
                      ...config,
                      contacts: { ...config.contacts, whatsappPhone: e.target.value },
                    });
                    onDirtyChange(true);
                  }}
                />
              </div>
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>Instagram URL</label>
                <input
                  value={config.contacts.instagramUrl}
                  onChange={(e) => {
                    setConfig({
                      ...config,
                      contacts: { ...config.contacts, instagramUrl: e.target.value },
                    });
                    onDirtyChange(true);
                  }}
                />
              </div>
              <div className={styles.field}>
                <label>Manager name</label>
                <input
                  value={config.contacts.managerName}
                  onChange={(e) => {
                    setConfig({
                      ...config,
                      contacts: { ...config.contacts, managerName: e.target.value },
                    });
                    onDirtyChange(true);
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3>Hero image</h3>
          </div>
          <div className={styles.panelBody}>
            <div className={styles.field}>
              <label>Hero photo URL</label>
              <input
                value={config.images.heroPhoto}
                onChange={(e) => {
                  setConfig({
                    ...config,
                    images: { ...config.images, heroPhoto: e.target.value },
                  });
                  onDirtyChange(true);
                }}
              />
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const url = await uploadImage(file);
                if (url) {
                  setConfig({
                    ...config,
                    images: { ...config.images, heroPhoto: url },
                  });
                  onDirtyChange(true);
                  showToast("Hero uploaded");
                }
              }}
            />
          </div>
        </div>

        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={saveConfig}>
          Save settings
        </button>
      </>
    );
  }

  if (tab === "analytics") {
    return (
      <>
        <div className={styles.toolbar}>
          <div className={styles.segmentedControl}>
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                type="button"
                className={`${styles.segmentedBtn} ${chartDays === d ? styles.segmentedBtnActive : ""}`}
                onClick={() => setChartDays(d)}
              >
                {d} days
              </button>
            ))}
          </div>
        </div>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3>Google Analytics</h3>
          </div>
          <div className={styles.panelBody}>
            <GaPanel data={ga} />
          </div>
        </div>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3>Store funnel</h3>
          </div>
          <div className={styles.panelBody}>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <div className={styles.statLabel}>Views</div>
                <div className={styles.statValue}>{analytics?.views ?? 0}</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statLabel}>Cart</div>
                <div className={styles.statValue}>{analytics?.cart ?? 0}</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statLabel}>WhatsApp</div>
                <div className={styles.statValue}>{analytics?.wa ?? 0}</div>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3>Trend</h3>
          </div>
          <div className={styles.chartBox}>
            {chartData ? <Line data={chartData} options={adminLineChartOptions()} /> : null}
          </div>
        </div>
      </>
    );
  }

  return null;
}
