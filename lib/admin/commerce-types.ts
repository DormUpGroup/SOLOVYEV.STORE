import type { OrderStatus } from "@/lib/types";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending_whatsapp",
  "in_chat",
  "paid",
  "shipped",
  "completed",
  "cancelled",
];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && ORDER_STATUSES.includes(value as OrderStatus);
}

export interface AdminUserRow {
  id: string;
  email: string;
  displayName: string | null;
  phone: string | null;
  marketingEmailOptIn: boolean;
  marketingEmailOptInAt: string | null;
  createdAt: string;
  ordersCount: number;
  lastOrderAt: string | null;
  favoritesCount: number;
  cartItemsCount: number;
}

export interface AdminUserDetail extends AdminUserRow {
  recentOrders: AdminOrderRow[];
}

export interface AdminOrderItemRow {
  id: number;
  productId: number | null;
  productTitle: string;
  productSlug: string;
  productImage: string;
  size: string;
  quantity: number;
  unitPrice: number;
}

export interface AdminOrderRow {
  id: string;
  orderRef: string;
  userId: string;
  customerEmail: string | null;
  customerName: string | null;
  status: OrderStatus;
  currencyCode: string;
  currencySymbol: string;
  subtotal: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrderDetail extends AdminOrderRow {
  whatsappUrl: string | null;
  adminNotes: string | null;
  trackingCode: string | null;
  shippingMethod: string | null;
  assignee: string | null;
  items: AdminOrderItemRow[];
}

export interface CommerceSummary {
  days: number;
  ordersCount: number;
  subtotalSum: number;
  averageOrderValue: number;
  byStatus: Record<OrderStatus, number>;
  dailyOrders: Array<{ date: string; count: number; subtotal: number }>;
  topProducts: Array<{
    productId: number | null;
    productTitle: string;
    productSlug: string;
    quantity: number;
    subtotal: number;
  }>;
  currencySymbol: string;
}
