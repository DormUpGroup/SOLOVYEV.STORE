import type { OrderStatus } from "@/lib/types";
import styles from "@/app/admin/admin.module.css";

const LABELS: Record<OrderStatus, string> = {
  pending_whatsapp: "Pending WA",
  in_chat: "In chat",
  paid: "Paid",
  shipped: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const className =
    status === "completed"
      ? styles.badgeNew
      : status === "cancelled"
        ? styles.badgeSold
        : status === "paid" || status === "shipped" || status === "in_chat"
          ? styles.badgeReserved
          : styles.badge;

  return <span className={`${styles.badge} ${className}`}>{LABELS[status]}</span>;
}
