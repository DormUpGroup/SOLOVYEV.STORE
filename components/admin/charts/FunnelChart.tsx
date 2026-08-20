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
  funnelConversionRate,
} from "@/lib/admin/chart-theme";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface FunnelChartProps {
  views: number;
  cart: number;
  whatsapp: number;
}

export function FunnelChart({ views, cart, whatsapp }: FunnelChartProps) {
  const data = useMemo(
    () => ({
      labels: ["Product views", "Add to cart", "WhatsApp checkout"],
      datasets: [
        {
          data: [views, cart, whatsapp],
          backgroundColor: [
            ADMIN_CHART_COLORS.primary,
            ADMIN_CHART_COLORS.purple,
            ADMIN_CHART_COLORS.success,
          ],
          borderRadius: 8,
          barThickness: 32,
        },
      ],
    }),
    [views, cart, whatsapp],
  );

  const values = [views, cart, whatsapp];

  const options = adminHorizontalBarOptions({
    plugins: {
      tooltip: {
        callbacks: {
          afterLabel(context) {
            const index = context.dataIndex;
            if (index === 0) return "";
            return funnelConversionRate(values[index], values[index - 1]);
          },
        },
      },
    },
  });

  if (views === 0 && cart === 0 && whatsapp === 0) {
    return <p style={{ color: ADMIN_CHART_COLORS.muted, fontSize: 14 }}>No funnel data yet.</p>;
  }

  return (
    <div style={{ height: 180 }}>
      <Bar data={data} options={options} />
    </div>
  );
}
