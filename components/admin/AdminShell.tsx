"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  Clock,
  Sparkles,
  Users,
  ShoppingBag,
  BarChart3,
  HelpCircle,
  Settings,
  LineChart,
  Store,
  LogOut,
  Menu,
  RefreshCw,
  Upload,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Product, StoreConfig } from "@/lib/types";
import { AdminClient } from "@/components/admin/cms/AdminClient";
import { LegacyTabs } from "@/components/admin/legacy/LegacyTabs";
import { UsersTab } from "@/components/admin/commerce/UsersTab";
import { OrdersTab } from "@/components/admin/commerce/OrdersTab";
import { ReportingTab } from "@/components/admin/commerce/ReportingTab";
import styles from "@/app/admin/admin.module.css";

type Tab =
  | "overview"
  | "catalog"
  | "made_to_order"
  | "brand_new"
  | "users"
  | "orders"
  | "reporting"
  | "faq"
  | "settings"
  | "analytics";

const TAB_LABELS: Record<Tab, string> = {
  overview: "Overview",
  catalog: "Catalog",
  made_to_order: "Made to order",
  brand_new: "Brand new",
  users: "Users",
  orders: "Orders",
  reporting: "Reporting",
  faq: "FAQ",
  settings: "Settings",
  analytics: "Analytics",
};

const TAB_ICONS: Record<Tab, LucideIcon> = {
  overview: LayoutDashboard,
  catalog: Package,
  made_to_order: Clock,
  brand_new: Sparkles,
  users: Users,
  orders: ShoppingBag,
  reporting: BarChart3,
  faq: HelpCircle,
  settings: Settings,
  analytics: LineChart,
};

const NAV_GROUPS: Array<{ label: string; tabs: Tab[] }> = [
  { label: "Store", tabs: ["catalog", "made_to_order", "brand_new"] },
  { label: "Commerce", tabs: ["orders", "users", "reporting"] },
  { label: "Content", tabs: ["faq", "settings"] },
  { label: "Insights", tabs: ["overview", "analytics"] },
];

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

  const refreshProducts = useCallback(async () => {
    const res = await fetch("/api/admin/products");
    if (!res.ok) {
      showToast("Failed to load products", false);
      return;
    }
    const json = await res.json();
    setProducts(json.products ?? []);
  }, [showToast]);

  useEffect(() => {
    void refreshProducts();
  }, [refreshProducts]);

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
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/auth/logout";
    document.body.appendChild(form);
    form.submit();
  };

  const selectTab = (next: Tab) => {
    setTab(next);
    setSidebarOpen(false);
  };

  return (
    <div className={`${styles.adminRoot} admin-cms`}>
      {sidebarOpen ? (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div className={styles.shell}>
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
          <div className={styles.brand}>Solovyev Store</div>

          {NAV_GROUPS.map((group) => (
            <div key={group.label} className={styles.navGroup}>
              <span className={styles.navGroupLabel}>{group.label}</span>
              {group.tabs.map((t) => {
                const Icon = TAB_ICONS[t];
                return (
                  <button
                    key={t}
                    type="button"
                    className={`${styles.navBtn} ${tab === t ? styles.navBtnActive : ""}`}
                    onClick={() => selectTab(t)}
                  >
                    <Icon size={18} strokeWidth={1.75} />
                    {TAB_LABELS[t]}
                  </button>
                );
              })}
            </div>
          ))}

          <div className={styles.sidebarFoot}>
            <Link href="/" className={styles.navBtn}>
              <Store size={18} strokeWidth={1.75} />
              View store
            </Link>
            <button type="button" className={`${styles.navBtn} ${styles.btnDanger}`} onClick={logout}>
              <LogOut size={18} strokeWidth={1.75} />
              Log out
            </button>
          </div>
        </aside>

        <main className={styles.main}>
          <div className={styles.topbar}>
            <div className={styles.topbarMeta}>
              <button
                type="button"
                className={`${styles.btn} ${styles.menuBtn}`}
                aria-label="Open menu"
                onClick={() => setSidebarOpen((v) => !v)}
              >
                <Menu size={18} />
              </button>
              <div>
                <h1 className={styles.pageTitle}>{TAB_LABELS[tab]}</h1>
                {dirty ? <span className={styles.hint}>Unsaved changes</span> : null}
              </div>
            </div>
            <div className={styles.topbarActions}>
              <button type="button" className={styles.btn} onClick={refreshProducts}>
                <span className="inline-flex items-center gap-1.5">
                  <RefreshCw size={14} />
                  Refresh
                </span>
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={publish}>
                <span className="inline-flex items-center gap-1.5">
                  <Upload size={14} />
                  Publish to site
                </span>
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
          ) : tab === "users" ? (
            <UsersTab showToast={showToast} />
          ) : tab === "orders" ? (
            <OrdersTab showToast={showToast} />
          ) : tab === "reporting" ? (
            <ReportingTab showToast={showToast} />
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
