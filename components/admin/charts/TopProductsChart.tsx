"use client";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useMemo } from "react";
import {
  ADMIN_CHART_COLORS,
  adminHorizontalBarOptions,
  truncateChartLabel,
} from "@/lib/admin/chart-theme";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface TopProductRow {
  productTitle: string;
  quantity: number;
  subtotal: number;
}

interface TopProductsChartProps {
  products: TopProductRow[];
  currencySymbol: string;
  limit?: number;
}

export function TopProductsChart({
  products,
  currencySymbol,
  limit = 10,
}: TopProductsChartProps) {
  const rows = useMemo(() => products.slice(0, limit), [products, limit]);

  const data = useMemo(
    () => ({
      labels: rows.map((p) => truncateChartLabel(p.productTitle)),
      datasets: [
        {
          label: "Revenue (paid)",
          data: rows.map((p) => Math.round(p.subtotal)),
          backgroundColor: ADMIN_CHART_COLORS.primary,
          borderRadius: 6,
          barThickness: 22,
        },
      ],
    }),
    [rows],
  );

  const options = adminHorizontalBarOptions({
    plugins: {
      tooltip: {
        callbacks: {
          label(context) {
            const row = rows[context.dataIndex];
            if (!row) return "";
            return [
              `Revenue: ${currencySymbol}${Math.round(row.subtotal)}`,
              `Quantity: ${row.quantity}`,
            ];
          },
        },
      },
    },
  });

  if (rows.length === 0) {
    return (
      <p style={{ color: ADMIN_CHART_COLORS.muted, fontSize: 14 }}>
        No paid product sales in this period.
      </p>
    );
  }

  const height = Math.max(220, rows.length * 44);

  return (
    <div style={{ height }}>
      <Bar data={data} options={options} />
    </div>
  );
}
