"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import {
  MinimalFooter,
  ToastNotification,
} from "@/components/layout/FooterBars";
import { ProductCard } from "@/components/catalog/ProductCard";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FaqModal } from "@/components/modals/FaqModal";
import { QuickViewModal } from "@/components/modals/QuickViewModal";
import { SellTradeModal } from "@/components/modals/SellTradeModal";
import { ThemeToggle } from "@/components/account/ThemeToggle";
import { useAuth } from "@/components/providers/AuthProvider";
import { useStore } from "@/components/providers/StoreProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { formatPrice, getProductBySlug } from "@/lib/products";
import { productImageSrc } from "@/lib/product-image";
import { useFavorites } from "@/components/providers/FavoritesProvider";

interface AccountData {
  user: { id: string; email?: string; createdAt: string };
  profile: {
    display_name?: string | null;
    phone?: string | null;
    marketing_email_opt_in?: boolean | null;
  } | null;
  favoriteIds: number[];
  orders: Array<{
    id: string;
    order_ref: string;
    status: string;
    currency_symbol: string;
    subtotal: number;
    created_at: string;
    order_items: Array<{
      id: number;
      product_title: string;
      product_slug: string;
      product_image?: string;
      size: string;
      quantity: number;
      unit_price: number;
    }>;
  }>;
}

export default function AccountPage() {
  const router = useRouter();
  const { signOut, refreshProfile } = useAuth();
  const { products } = useStore();
  const { dict, locale } = useI18n();
  const { favoriteIds } = useFavorites();
  const copy = dict.account;
  const [data, setData] = useState<AccountData | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [marketingBusy, setMarketingBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    fetch("/api/account")
      .then(async (response) => {
        if (response.status === 401) return router.replace("/login?next=/account");
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Could not load account");
        setData(body);
        setDisplayName(body.profile?.display_name ?? "");
        setPhone(body.profile?.phone ?? "");
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load account"));
  }, [router]);

  const favorites = useMemo(
    () => products.filter((product) => favoriteIds.has(product.id)),
    [favoriteIds, products],
  );

  const savedName = data?.profile?.display_name?.trim() ?? "";
  const savedPhone = data?.profile?.phone?.trim() ?? "";
  const marketingOptIn = Boolean(data?.profile?.marketing_email_opt_in);

  const itemImage = (item: AccountData["orders"][number]["order_items"][number]) => {
    const fromOrder = productImageSrc(item.product_image);
    if (fromOrder) return fromOrder;
    const catalog = getProductBySlug(products, item.product_slug);
    return productImageSrc(catalog?.img) ?? productImageSrc(catalog?.images?.[0]?.imageUrl);
  };

  const startEdit = () => {
    setDisplayName(savedName);
    setPhone(savedPhone);
    setEditing(true);
    setError("");
    setSuccess("");
  };

  const cancelEdit = () => {
    setDisplayName(savedName);
    setPhone(savedPhone);
    setEditing(false);
    setError("");
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    const nextName = displayName.trim();
    if (!nextName) {
      setError(copy.nameRequired);
      return;
    }
    const nextPhone = phone.trim().slice(0, 30);
    setSaving(true);
    setError("");
    setSuccess("");
    const response = await fetch("/api/account", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ displayName: nextName, phone: nextPhone }),
    });
    const body = await response.json() as {
      error?: string;
      profile?: {
        display_name?: string | null;
        phone?: string | null;
        marketing_email_opt_in?: boolean | null;
      };
    };
    setSaving(false);
    if (!response.ok) {
      setError(body.error || "Could not save profile");
      return;
    }
    const savedDisplayName = body.profile?.display_name?.trim() || nextName;
    const savedPhoneValue = body.profile?.phone?.trim() || nextPhone;
    setDisplayName(savedDisplayName);
    setPhone(savedPhoneValue);
    setData((prev) =>
      prev
        ? {
            ...prev,
            profile: {
              ...prev.profile,
              ...body.profile,
              display_name: savedDisplayName,
              phone: savedPhoneValue || null,
            },
          }
        : prev,
    );
    setEditing(false);
    setSuccess(copy.profileSaved);
    await refreshProfile();
  };

  const toggleMarketing = async () => {
    if (!data) return;
    setMarketingBusy(true);
    setError("");
    setSuccess("");
    const next = !marketingOptIn;
    const response = await fetch("/api/account", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ marketingEmailOptIn: next, locale }),
    });
    const body = await response.json() as {
      error?: string;
      profile?: {
        display_name?: string | null;
        marketing_email_opt_in?: boolean | null;
      };
    };
    setMarketingBusy(false);
    if (!response.ok) {
      setError(body.error || "Could not save preference");
      return;
    }
    setData((prev) =>
      prev ? { ...prev, profile: { ...prev.profile, ...body.profile } } : prev,
    );
    setSuccess(copy.marketingSaved);
  };

  const logout = async () => {
    await signOut();
    router.replace("/");
    router.refresh();
  };

  return (
    <>
      <Header />
      <main className="account-page">
        <div className="account-page-header">
          <p className="account-eyebrow">SOLOVYEV STORE</p>
          <div className="account-greeting-row">
            <h1>
              {savedName
                ? copy.greeting.replace("{name}", savedName)
                : copy.title}
            </h1>
            {!editing ? (
              <button type="button" className="account-edit-name" onClick={startEdit}>
                {copy.editProfile}
              </button>
            ) : null}
          </div>
          <p className="account-muted">{data?.user.email}</p>
          {!editing ? (
            <p className="account-muted">
              {copy.phone}: {savedPhone || "—"}
            </p>
          ) : null}

          {editing ? (
            <form className="account-profile-edit" onSubmit={saveProfile}>
              <label>
                {copy.name}
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  maxLength={80}
                  autoFocus
                  placeholder={copy.namePlaceholder}
                />
              </label>
              <label>
                {copy.phone}
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  maxLength={30}
                  placeholder={copy.phonePlaceholder}
                  inputMode="tel"
                />
              </label>
              <ThemeToggle />
              <div className="account-profile-edit-actions">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? copy.saving : copy.save}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  {copy.cancelEdit}
                </button>
              </div>
            </form>
          ) : null}
        </div>

        {error ? <p className="account-error" role="alert">{error}</p> : null}
        {success ? <p className="account-success" role="status">{success}</p> : null}
        {!data ? <div className="account-card">{copy.loading}</div> : (
          <div className="account-sections">
            <section>
              <div className="account-section-title"><h2>{copy.favorites}</h2><span>{favorites.length}</span></div>
              {favorites.length ? (
                <div className="account-product-grid">
                  {favorites.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="account-empty-block">
                  <p className="account-muted">{copy.noFavorites}</p>
                  <Link href="/drops" className="btn-secondary account-empty-link">{copy.shop}</Link>
                </div>
              )}
            </section>

            <section>
              <div className="account-section-title"><h2>{copy.orders}</h2><span>{data.orders.length}</span></div>
              {data.orders.length ? (
                <div className="account-order-list">{data.orders.map((order) => (
                  <article className="account-card account-order" key={order.id}>
                    <div className="account-order-head">
                      <div><strong>{order.order_ref}</strong><p>{new Date(order.created_at).toLocaleDateString()}</p></div>
                      <span className="account-status">{order.status.replace("_", " ")}</span>
                    </div>
                    <ul>{order.order_items.map((item) => {
                      const src = itemImage(item);
                      return (
                        <li key={item.id}>
                          {src ? (
                            <Link href={`/product/${item.product_slug}`} className="account-order-thumb">
                              <Image src={src} alt={item.product_title} width={64} height={64} />
                            </Link>
                          ) : (
                            <span className="account-order-thumb account-order-thumb-empty" aria-hidden="true" />
                          )}
                          <div className="account-order-item-meta">
                            <Link href={`/product/${item.product_slug}`}>{item.product_title}</Link>
                            <span>{item.size || copy.oneSize} × {item.quantity}</span>
                          </div>
                          <strong>{formatPrice(Number(item.unit_price) * item.quantity, order.currency_symbol)}</strong>
                        </li>
                      );
                    })}</ul>
                  </article>
                ))}</div>
              ) : (
                <div className="account-empty-block">
                  <p className="account-muted">{copy.noOrders}</p>
                  <Link href="/drops" className="btn-secondary account-empty-link">{copy.shop}</Link>
                </div>
              )}
            </section>

            <section>
              <div className="account-section-title"><h2>{copy.marketingPreferences}</h2></div>
              <div className="account-card account-marketing">
                <p>{marketingOptIn ? copy.marketingEnabled : copy.marketingDisabled}</p>
                <p className="account-muted">{copy.marketingOptInHelp}</p>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={marketingBusy}
                  onClick={() => void toggleMarketing()}
                >
                  {marketingBusy
                    ? copy.saving
                    : marketingOptIn
                      ? copy.marketingToggleOff
                      : copy.marketingToggleOn}
                </button>
              </div>
            </section>

            <div className="account-signout-row">
              <button type="button" className="account-signout-btn" onClick={() => void logout()}>
                {copy.signOut}
              </button>
            </div>
          </div>
        )}
      </main>
      <MinimalFooter />
      <ToastNotification />
      <QuickViewModal />
      <SellTradeModal />
      <FaqModal />
      <CartDrawer />
    </>
  );
}
