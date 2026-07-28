"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { ProductCard } from "@/components/catalog/ProductCard";
import { useAuth } from "@/components/providers/AuthProvider";
import { useStore } from "@/components/providers/StoreProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { formatPrice } from "@/lib/products";
import { useFavorites } from "@/components/providers/FavoritesProvider";

interface AccountData {
  user: { id: string; email?: string; createdAt: string };
  profile: { display_name?: string; phone?: string } | null;
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
      size: string;
      quantity: number;
      unit_price: number;
    }>;
  }>;
}

export default function AccountPage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { products } = useStore();
  const { dict } = useI18n();
  const { favoriteIds } = useFavorites();
  const copy = dict.account;
  const [data, setData] = useState<AccountData | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
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

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch("/api/account", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ displayName, phone }),
    });
    const body = await response.json();
    setSaving(false);
    if (!response.ok) setError(body.error || "Could not save profile");
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
          <div>
            <p className="account-eyebrow">SOLOVYEV STORE</p>
            <h1>{copy.title}</h1>
            <p className="account-muted">{data?.user.email}</p>
          </div>
          <button type="button" className="btn-secondary" onClick={() => void logout()}>{copy.signOut}</button>
        </div>

        {error ? <p className="account-error" role="alert">{error}</p> : null}
        {!data ? <div className="account-card">{copy.loading}</div> : (
          <div className="account-sections">
            <section className="account-card">
              <h2>{copy.profile}</h2>
              <form className="account-form account-profile-form" onSubmit={saveProfile}>
                <label>{copy.name}<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label>
                <label>{copy.phone}<input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" /></label>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? copy.saving : copy.save}</button>
              </form>
            </section>

            <section>
              <div className="account-section-title"><h2>{copy.favorites}</h2><span>{favorites.length}</span></div>
              {favorites.length ? <div className="account-product-grid">{favorites.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="account-card account-empty"><p>{copy.noFavorites}</p><Link href="/drops" className="btn-secondary">{copy.shop}</Link></div>}
            </section>

            <section>
              <div className="account-section-title"><h2>{copy.orders}</h2><span>{data.orders.length}</span></div>
              {data.orders.length ? <div className="account-order-list">{data.orders.map((order) => (
                <article className="account-card account-order" key={order.id}>
                  <div className="account-order-head">
                    <div><strong>{order.order_ref}</strong><p>{new Date(order.created_at).toLocaleDateString()}</p></div>
                    <span className="account-status">{order.status.replace("_", " ")}</span>
                  </div>
                  <ul>{order.order_items.map((item) => <li key={item.id}><Link href={`/product/${item.product_slug}`}>{item.product_title}</Link><span>{item.size || copy.oneSize} × {item.quantity}</span><strong>{formatPrice(Number(item.unit_price) * item.quantity, order.currency_symbol)}</strong></li>)}</ul>
                  <div className="account-order-total">{copy.total}: <strong>{formatPrice(Number(order.subtotal), order.currency_symbol)}</strong></div>
                </article>
              ))}</div> : <div className="account-card account-empty">{copy.noOrders}</div>}
            </section>
          </div>
        )}
      </main>
    </>
  );
}
