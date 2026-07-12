"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Product, StoreConfig } from "@/lib/types";
import { AdminClient } from "@/components/admin/cms/AdminClient";
import { LegacyTabs } from "@/components/admin/legacy/LegacyTabs";
import styles from "@/app/admin/admin.module.css";

type Tab = "overview" | "catalog" | "made_to_order" | "brand_new" | "faq" | "settings" | "analytics";

const TAB_LABELS: Record<Tab, string> = {
  overview: "Overview",
  catalog: "Catalog",
  made_to_order: "Made to order",
  brand_new: "Brand new",
  faq: "FAQ",
  settings: "Settings",
  analytics: "Analytics",
};

interface AdminShellProps {
  initialProducts: Product[];
}

export function AdminShell({ initialProducts }: AdminShellProps) {
  const [tab, setTab] = useState<Tab>("catalog");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [products, setProducts] = useState(initialProducts);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    fetch("/api/admin/config")
      .then((r) => r.json())
      .then((json) => setConfig(json.config ?? null))
      .catch(() => undefined);
  }, []);

  const publish = async () => {
    const res = await fetch("/api/admin/publish", { method: "POST" });
    if (res.ok) {
      showToast("Published — site cache refreshed");
      setDirty(false);
    } else {
      showToast("Publish failed", false);
    }
  };

  const logout = () => {
    window.location.href = "/api/auth/logout";
  };

  const refreshProducts = async () => {
    const res = await fetch("/api/admin/products");
    if (res.ok) {
      const json = await res.json();
      setProducts(json.products ?? []);
    }
  };

  return (
    <div className={`${styles.adminRoot} admin-cms`}>
      <div className={styles.shell}>
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
          <div className={styles.brand}>SOLOVYEV STORE</div>
          {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`${styles.navBtn} ${tab === t ? styles.navBtnActive : ""}`}
              onClick={() => {
                setTab(t);
                setSidebarOpen(false);
              }}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
          <div className={styles.sidebarFoot}>
            <Link href="/" className={styles.navBtn} style={{ display: "block", textAlign: "left" }}>
              ← Store
            </Link>
            <button type="button" className={`${styles.navBtn} ${styles.btnDanger}`} onClick={logout}>
              Logout
            </button>
          </div>
        </aside>

        <main className={styles.main}>
          <div className={styles.topbar}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="button"
                className={`${styles.btn} ${styles.menuBtn}`}
                onClick={() => setSidebarOpen((v) => !v)}
              >
                ☰
              </button>
              <h2>{TAB_LABELS[tab]}</h2>
              {dirty ? <span className={styles.hint}>Unsaved changes</span> : null}
            </div>
            <div className={styles.topbarActions}>
              <button type="button" className={styles.btn} onClick={refreshProducts}>
                Refresh
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={publish}>
                Publish to site
              </button>
            </div>
          </div>

          {tab === "catalog" || tab === "made_to_order" || tab === "brand_new" ? (
            <AdminClient
              initialProducts={products}
              config={config}
              onProductsChange={setProducts}
              mode={
                tab === "made_to_order"
                  ? "made_to_order"
                  : tab === "brand_new"
                    ? "brand_new"
                    : "catalog"
              }
            />
          ) : (
            <LegacyTabs
              tab={tab}
              products={products}
              onDirtyChange={setDirty}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {toast ? (
        <div className={`${styles.toast} ${toast.ok ? styles.toastOk : styles.toastErr}`}>{toast.msg}</div>
      ) : null}
    </div>
  );
}
