"use client";

import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { useMemo } from "react";
import type { OrderStatus } from "@/lib/types";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/admin/commerce-types";
import {
  ADMIN_CHART_COLORS,
  ORDER_STATUS_CHART_COLORS,
  adminDoughnutOptions,
} from "@/lib/admin/chart-theme";

ChartJS.register(ArcElement, Tooltip, Legend);

const STATUS_LABELS = ORDER_STATUS_LABELS;

interface OrderStatusChartProps {
  byStatus: Record<OrderStatus, number>;
}

export function OrderStatusChart({ byStatus }: OrderStatusChartProps) {
  const { labels, values, colors } = useMemo(() => {
    const active = ORDER_STATUSES.filter((status) => (byStatus[status] ?? 0) > 0);
    return {
      labels: active.map((status) => STATUS_LABELS[status]),
      values: active.map((status) => byStatus[status]),
      colors: active.map((status) => ORDER_STATUS_CHART_COLORS[status]),
    };
  }, [byStatus]);

  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 6,
        },
      ],
    }),
    [labels, values, colors],
  );

  if (values.length === 0) {
    return <p style={{ color: ADMIN_CHART_COLORS.muted, fontSize: 14 }}>No orders in this period.</p>;
  }

  return (
    <div style={{ height: 280 }}>
      <Doughnut data={data} options={adminDoughnutOptions()} />
    </div>
  );
}
