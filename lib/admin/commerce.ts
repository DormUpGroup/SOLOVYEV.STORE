import { createServiceClient } from "@/utils/supabase/admin";
import type { OrderStatus } from "@/lib/types";
import {
  isOrderStatus,
  type AdminOrderDetail,
  type AdminOrderItemRow,
  type AdminOrderRow,
  type AdminUserDetail,
  type AdminUserRow,
  type CommerceSummary,
} from "@/lib/admin/commerce-types";

type ProfileRow = {
  id: string;
  email: string;
  display_name: string | null;
  phone: string | null;
  marketing_email_opt_in: boolean | null;
  marketing_email_opt_in_at: string | null;
  created_at: string;
};

type OrderRow = {
  id: string;
  user_id: string;
  order_ref: string;
  status: string;
  currency_code: string;
  currency_symbol: string;
  subtotal: number | string;
  whatsapp_url?: string | null;
  created_at: string;
  updated_at: string;
};

type OrderItemRow = {
  id: number;
  product_id: number | null;
  product_title: string;
  product_slug: string;
  product_image: string;
  size: string;
  quantity: number;
  unit_price: number | string;
};

function mapOrderItem(row: OrderItemRow): AdminOrderItemRow {
  return {
    id: row.id,
    productId: row.product_id,
    productTitle: row.product_title,
    productSlug: row.product_slug,
    productImage: row.product_image ?? "",
    size: row.size ?? "",
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
  };
}

function mapOrderRow(
  row: OrderRow,
  profile: { email?: string | null; display_name?: string | null } | null,
  itemCount = 0,
): AdminOrderRow {
  const status = isOrderStatus(row.status) ? row.status : "pending_whatsapp";
  return {
    id: row.id,
    orderRef: row.order_ref,
    userId: row.user_id,
    customerEmail: profile?.email ?? null,
    customerName: profile?.display_name ?? null,
    status,
    currencyCode: row.currency_code,
    currencySymbol: row.currency_symbol,
    subtotal: Number(row.subtotal),
    itemCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAdminUsers(options: {
  page?: number;
  limit?: number;
  search?: string;
  hasOrders?: boolean;
}): Promise<{ users: AdminUserRow[]; total: number }> {
  const admin = createServiceClient();
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 25));
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const search = options.search?.trim() ?? "";

  let query = admin
    .from("profiles")
    .select(
      "id,email,display_name,phone,marketing_email_opt_in,marketing_email_opt_in_at,created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) {
    const escaped = search.replace(/[%_,]/g, "");
    query = query.or(`email.ilike.%${escaped}%,display_name.ilike.%${escaped}%`);
  }

  const { data: profiles, error, count } = await query;
  if (error) throw new Error(error.message);

  const rows = (profiles ?? []) as ProfileRow[];
  if (!rows.length) return { users: [], total: count ?? 0 };

  const ids = rows.map((p) => p.id);
  const [ordersRes, favoritesRes, cartRes] = await Promise.all([
    admin.from("orders").select("user_id,created_at").in("user_id", ids),
    admin.from("favorites").select("user_id").in("user_id", ids),
    admin.from("cart_items").select("user_id").in("user_id", ids),
  ]);

  if (ordersRes.error) throw new Error(ordersRes.error.message);
  if (favoritesRes.error) throw new Error(favoritesRes.error.message);
  if (cartRes.error) throw new Error(cartRes.error.message);

  const ordersByUser = new Map<string, { count: number; lastAt: string | null }>();
  for (const order of ordersRes.data ?? []) {
    const current = ordersByUser.get(order.user_id) ?? { count: 0, lastAt: null };
    current.count += 1;
    if (!current.lastAt || order.created_at > current.lastAt) {
      current.lastAt = order.created_at;
    }
    ordersByUser.set(order.user_id, current);
  }

  const favoritesCount = new Map<string, number>();
  for (const row of favoritesRes.data ?? []) {
    favoritesCount.set(row.user_id, (favoritesCount.get(row.user_id) ?? 0) + 1);
  }

  const cartCount = new Map<string, number>();
  for (const row of cartRes.data ?? []) {
    cartCount.set(row.user_id, (cartCount.get(row.user_id) ?? 0) + 1);
  }

  let users: AdminUserRow[] = rows.map((profile) => {
    const orderMeta = ordersByUser.get(profile.id) ?? { count: 0, lastAt: null };
    return {
      id: profile.id,
      email: profile.email,
      displayName: profile.display_name,
      phone: profile.phone,
      marketingEmailOptIn: Boolean(profile.marketing_email_opt_in),
      marketingEmailOptInAt: profile.marketing_email_opt_in_at,
      createdAt: profile.created_at,
      ordersCount: orderMeta.count,
      lastOrderAt: orderMeta.lastAt,
      favoritesCount: favoritesCount.get(profile.id) ?? 0,
      cartItemsCount: cartCount.get(profile.id) ?? 0,
    };
  });

  if (options.hasOrders) {
    users = users.filter((u) => u.ordersCount > 0);
  }

  return { users, total: count ?? users.length };
}

export async function getAdminUser(id: string): Promise<AdminUserDetail | null> {
  const admin = createServiceClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select(
      "id,email,display_name,phone,marketing_email_opt_in,marketing_email_opt_in_at,created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!profile) return null;

  const list = await listAdminUsers({ page: 1, limit: 1, search: profile.email });
  const base =
    list.users.find((u) => u.id === id) ??
    ({
      id: profile.id,
      email: profile.email,
      displayName: profile.display_name,
      phone: profile.phone,
      marketingEmailOptIn: Boolean(profile.marketing_email_opt_in),
      marketingEmailOptInAt: profile.marketing_email_opt_in_at,
      createdAt: profile.created_at,
      ordersCount: 0,
      lastOrderAt: null,
      favoritesCount: 0,
      cartItemsCount: 0,
    } satisfies AdminUserRow);

  const { data: orders, error: ordersError } = await admin
    .from("orders")
    .select(
      "id,user_id,order_ref,status,currency_code,currency_symbol,subtotal,created_at,updated_at,order_items(id)",
    )
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (ordersError) throw new Error(ordersError.message);

  const recentOrders = ((orders ?? []) as Array<OrderRow & { order_items?: { id: number }[] }>).map(
    (row) =>
      mapOrderRow(row, { email: profile.email, display_name: profile.display_name }, row.order_items?.length ?? 0),
  );

  return { ...base, recentOrders };
}

export async function listAdminOrders(options: {
  page?: number;
  limit?: number;
  status?: OrderStatus | "";
  search?: string;
  since?: string;
}): Promise<{ orders: AdminOrderRow[]; total: number }> {
  const admin = createServiceClient();
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 25));
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const search = options.search?.trim() ?? "";

  let query = admin
    .from("orders")
    .select(
      "id,user_id,order_ref,status,currency_code,currency_symbol,subtotal,created_at,updated_at,order_items(id)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (options.status && isOrderStatus(options.status)) {
    query = query.eq("status", options.status);
  }
  if (options.since) {
    query = query.gte("created_at", options.since);
  }
  if (search) {
    const escaped = search.replace(/[%_,]/g, "");
    // Search by order_ref; email search handled after join if needed
    query = query.ilike("order_ref", `%${escaped}%`);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  let orderRows = (data ?? []) as Array<OrderRow & { order_items?: { id: number }[] }>;

  // If search looks like email/name, also find matching users and re-query
  if (search && search.includes("@")) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id")
      .ilike("email", `%${search.replace(/[%_,]/g, "")}%`);
    const userIds = (profiles ?? []).map((p) => p.id);
    if (userIds.length) {
      let emailQuery = admin
        .from("orders")
        .select(
          "id,user_id,order_ref,status,currency_code,currency_symbol,subtotal,created_at,updated_at,order_items(id)",
          { count: "exact" },
        )
        .in("user_id", userIds)
        .order("created_at", { ascending: false })
        .range(from, to);
      if (options.status && isOrderStatus(options.status)) {
        emailQuery = emailQuery.eq("status", options.status);
      }
      const emailRes = await emailQuery;
      if (!emailRes.error && emailRes.data) {
        orderRows = emailRes.data as Array<OrderRow & { order_items?: { id: number }[] }>;
        const userIdsAll = [...new Set(orderRows.map((o) => o.user_id))];
        const profilesMap = await loadProfilesMap(userIdsAll);
        return {
          orders: orderRows.map((row) =>
            mapOrderRow(row, profilesMap.get(row.user_id) ?? null, row.order_items?.length ?? 0),
          ),
          total: emailRes.count ?? orderRows.length,
        };
      }
    }
  }

  const userIds = [...new Set(orderRows.map((o) => o.user_id))];
  const profilesMap = await loadProfilesMap(userIds);

  return {
    orders: orderRows.map((row) =>
      mapOrderRow(row, profilesMap.get(row.user_id) ?? null, row.order_items?.length ?? 0),
    ),
    total: count ?? orderRows.length,
  };
}

async function loadProfilesMap(userIds: string[]) {
  const map = new Map<string, { email: string; display_name: string | null }>();
  if (!userIds.length) return map;
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id,email,display_name")
    .in("id", userIds);
  if (error) throw new Error(error.message);
  for (const row of data ?? []) {
    map.set(row.id, { email: row.email, display_name: row.display_name });
  }
  return map;
}

export async function getAdminOrder(id: string): Promise<AdminOrderDetail | null> {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("orders")
    .select(
      "id,user_id,order_ref,status,currency_code,currency_symbol,subtotal,whatsapp_url,created_at,updated_at,order_items(*)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as OrderRow & { order_items?: OrderItemRow[] };
  const profilesMap = await loadProfilesMap([row.user_id]);
  const items = (row.order_items ?? []).map(mapOrderItem);
  const base = mapOrderRow(row, profilesMap.get(row.user_id) ?? null, items.length);

  return {
    ...base,
    whatsappUrl: row.whatsapp_url ?? null,
    items,
  };
}

export async function updateAdminOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<AdminOrderDetail | null> {
  if (!isOrderStatus(status)) {
    throw new Error("Invalid status");
  }
  const admin = createServiceClient();
  const { error } = await admin.from("orders").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  return getAdminOrder(id);
}

export async function getCommerceSummary(daysInput = 7): Promise<CommerceSummary> {
  const days = [7, 30, 90].includes(daysInput) ? daysInput : 7;
  const admin = createServiceClient();
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (days - 1));
  const sinceIso = since.toISOString();

  const { data: orders, error } = await admin
    .from("orders")
    .select(
      "id,status,subtotal,currency_symbol,created_at,order_items(product_id,product_title,product_slug,quantity,unit_price)",
    )
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  type SummaryOrder = {
    id: string;
    status: string;
    subtotal: number | string;
    currency_symbol: string;
    created_at: string;
    order_items?: Array<{
      product_id: number | null;
      product_title: string;
      product_slug: string;
      quantity: number;
      unit_price: number | string;
    }>;
  };

  const rows = (orders ?? []) as SummaryOrder[];
  const byStatus: Record<OrderStatus, number> = {
    pending_whatsapp: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
  };

  let subtotalSum = 0;
  const dailyMap = new Map<string, { count: number; subtotal: number }>();
  const productMap = new Map<
    string,
    {
      productId: number | null;
      productTitle: string;
      productSlug: string;
      quantity: number;
      subtotal: number;
    }
  >();

  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setUTCDate(since.getUTCDate() + i);
    dailyMap.set(d.toISOString().slice(0, 10), { count: 0, subtotal: 0 });
  }

  let currencySymbol = "₪";

  for (const order of rows) {
    const status = isOrderStatus(order.status) ? order.status : "pending_whatsapp";
    byStatus[status] += 1;
    const subtotal = Number(order.subtotal) || 0;
    subtotalSum += subtotal;
    currencySymbol = order.currency_symbol || currencySymbol;
    const day = order.created_at.slice(0, 10);
    const bucket = dailyMap.get(day) ?? { count: 0, subtotal: 0 };
    bucket.count += 1;
    bucket.subtotal += subtotal;
    dailyMap.set(day, bucket);

    for (const item of order.order_items ?? []) {
      const key = String(item.product_id ?? item.product_slug);
      const current = productMap.get(key) ?? {
        productId: item.product_id,
        productTitle: item.product_title,
        productSlug: item.product_slug,
        quantity: 0,
        subtotal: 0,
      };
      current.quantity += Number(item.quantity) || 0;
      current.subtotal += (Number(item.unit_price) || 0) * (Number(item.quantity) || 0);
      productMap.set(key, current);
    }
  }

  const ordersCount = rows.length;
  const topProducts = [...productMap.values()]
    .sort((a, b) => b.quantity - a.quantity || b.subtotal - a.subtotal)
    .slice(0, 10);

  return {
    days,
    ordersCount,
    subtotalSum,
    averageOrderValue: ordersCount ? subtotalSum / ordersCount : 0,
    byStatus,
    dailyOrders: [...dailyMap.entries()].map(([date, value]) => ({
      date,
      count: value.count,
      subtotal: value.subtotal,
    })),
    topProducts,
    currencySymbol,
  };
}
