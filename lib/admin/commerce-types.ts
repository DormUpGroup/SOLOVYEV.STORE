import type { OrderStatus } from "@/lib/types";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending_whatsapp",
  "in_chat",
  "paid",
  "shipped",
  "completed",
  "cancelled",
];

/** Display labels for order statuses (admin UI + PDF reports). */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_whatsapp: "Pending WhatsApp",
  in_chat: "In chat",
  paid: "Paid",
  shipped: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Order statuses that count toward admin revenue metrics. */
export const REVENUE_ORDER_STATUSES: OrderStatus[] = ["paid"];

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
  discountPercent: number;
  discountAmount: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrderDetail extends AdminOrderRow {
  whatsappUrl: string | null;
  customerPhone: string | null;
  customerChatUrl: string | null;
  adminNotes: string | null;
  trackingCode: string | null;
  shippingMethod: string | null;
  assignee: string | null;
  items: AdminOrderItemRow[];
}

export interface CommerceSummary {
  days: number;
  ordersCount: number;
  paidOrdersCount: number;
  revenueSum: number;
  averageOrderRevenue: number;
  byStatus: Record<OrderStatus, number>;
  dailyOrders: Array<{ date: string; count: number; revenue: number }>;
  topProducts: Array<{
    productId: number | null;
    productTitle: string;
    productSlug: string;
    quantity: number;
    subtotal: number;
  }>;
  currencySymbol: string;
}
