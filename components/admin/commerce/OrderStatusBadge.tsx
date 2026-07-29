import type { OrderStatus } from "@/lib/types";
import styles from "@/app/admin/admin.module.css";

const LABELS: Record<OrderStatus, string> = {
  pending_whatsapp: "Pending WA",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const className =
    status === "completed"
      ? styles.badgeNew
      : status === "cancelled"
        ? styles.badgeSold
        : status === "confirmed"
          ? styles.badgeReserved
          : styles.badge;

  return <span className={`${styles.badge} ${className}`}>{LABELS[status]}</span>;
}
