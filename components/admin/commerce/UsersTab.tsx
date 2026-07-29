"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminUserDetail, AdminUserRow } from "@/lib/admin/commerce-types";
import { OrderStatusBadge } from "@/components/admin/commerce/OrderStatusBadge";
import styles from "@/app/admin/admin.module.css";

interface UsersTabProps {
  showToast: (msg: string, ok?: boolean) => void;
}

export function UsersTab({ showToast }: UsersTabProps) {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [hasOrders, setHasOrders] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const limit = 25;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.set("search", search);
      if (hasOrders) params.set("hasOrders", "1");
      const res = await fetch(`/api/admin/users?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load users");
      setUsers(json.users ?? []);
      setTotal(json.total ?? 0);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load users", false);
    } finally {
      setLoading(false);
    }
  }, [page, search, hasOrders, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const openUser = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load user");
      setSelected(json.user);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load user", false);
    } finally {
      setDetailLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <>
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
            placeholder="Search email or name"
            style={{ minWidth: 220 }}
          />
          <button type="submit" className={styles.btn}>
            Search
          </button>
          <label className={styles.hint} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={hasOrders}
              onChange={(event) => {
                setPage(1);
                setHasOrders(event.target.checked);
              }}
            />
            Has orders
          </label>
        </form>
        <button type="button" className={styles.btn} onClick={() => void load()}>
          Refresh
        </button>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Users shown</div>
          <div className={styles.statValue}>{users.length}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Total match</div>
          <div className={styles.statValue}>{total}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Marketing opt-in</div>
          <div className={styles.statValue}>
            {users.filter((u) => u.marketingEmailOptIn).length}
          </div>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <h3>Customers</h3>
          {loading ? <span className={styles.hint}>Loading…</span> : null}
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Registered</th>
                <th>Marketing</th>
                <th>Orders</th>
                <th>Last order</th>
                <th>Fav / Cart</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <span className={styles.hint}>No users found.</span>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => void openUser(user.id)}
                  >
                    <td>{user.email}</td>
                    <td>{user.displayName || "—"}</td>
                    <td>{user.phone || "—"}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>{user.marketingEmailOptIn ? "Yes" : "No"}</td>
                    <td>{user.ordersCount}</td>
                    <td>
                      {user.lastOrderAt
                        ? new Date(user.lastOrderAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      {user.favoritesCount} / {user.cartItemsCount}
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

      {(selected || detailLoading) && (
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3>User detail</h3>
            <button type="button" className={styles.btn} onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
          <div className={styles.panelBody}>
            {detailLoading || !selected ? (
              <p className={styles.hint}>Loading…</p>
            ) : (
              <>
                <p>
                  <strong>{selected.email}</strong>
                  {selected.displayName ? ` · ${selected.displayName}` : ""}
                </p>
                <p className={styles.hint}>
                  Phone: {selected.phone || "—"} · Marketing:{" "}
                  {selected.marketingEmailOptIn ? "opt-in" : "opt-out"}
                  {selected.marketingEmailOptInAt
                    ? ` (${new Date(selected.marketingEmailOptInAt).toLocaleString()})`
                    : ""}
                </p>
                <p className={styles.hint}>
                  Registered {new Date(selected.createdAt).toLocaleString()} · Favorites{" "}
                  {selected.favoritesCount} · Cart {selected.cartItemsCount}
                </p>
                <h4 style={{ marginTop: 16 }}>Recent orders</h4>
                {selected.recentOrders.length === 0 ? (
                  <p className={styles.hint}>No orders.</p>
                ) : (
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Ref</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Subtotal</th>
                          <th>Items</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected.recentOrders.map((order) => (
                          <tr key={order.id}>
                            <td>{order.orderRef}</td>
                            <td>{new Date(order.createdAt).toLocaleString()}</td>
                            <td>
                              <OrderStatusBadge status={order.status} />
                            </td>
                            <td>
                              {order.currencySymbol}
                              {order.subtotal.toFixed(0)}
                            </td>
                            <td>{order.itemCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
