import type { ChartOptions } from "chart.js";
import type { OrderStatus } from "@/lib/types";

export const ADMIN_CHART_COLORS = {
  primary: "#0a84ff",
  purple: "#bf5af2",
  success: "#30d158",
  warning: "#ffd60a",
  danger: "#ff453a",
  muted: "#98989d",
  grid: "rgba(255,255,255,0.06)",
  text: "#98989d",
};

export const ORDER_STATUS_CHART_COLORS: Record<OrderStatus, string> = {
  pending_whatsapp: "#98989d",
  in_chat: "#ffd60a",
  paid: "#0a84ff",
  shipped: "#bf5af2",
  completed: "#30d158",
  cancelled: "#ff453a",
};

const adminTooltip = {
  backgroundColor: "#1c1c1e",
  borderColor: "rgba(255,255,255,0.1)",
  borderWidth: 1,
  titleColor: "#f5f5f7",
  bodyColor: "#98989d",
  padding: 12,
  cornerRadius: 10,
};

export function adminLineChartOptions(
  extra?: ChartOptions<"line">,
): ChartOptions<"line"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: ADMIN_CHART_COLORS.text, boxWidth: 12, usePointStyle: true },
      },
      tooltip: adminTooltip,
    },
    scales: {
      x: {
        ticks: { color: ADMIN_CHART_COLORS.text },
        grid: { color: ADMIN_CHART_COLORS.grid },
      },
      y: {
        beginAtZero: true,
        ticks: { color: ADMIN_CHART_COLORS.text, precision: 0 },
        grid: { color: ADMIN_CHART_COLORS.grid },
      },
      y1: {
        beginAtZero: true,
        position: "right",
        ticks: { color: ADMIN_CHART_COLORS.text },
        grid: { drawOnChartArea: false, color: ADMIN_CHART_COLORS.grid },
      },
    },
    ...extra,
  };
}

export function adminHorizontalBarOptions(
  extra?: ChartOptions<"bar">,
): ChartOptions<"bar"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y",
    plugins: {
      legend: { display: false },
      tooltip: adminTooltip,
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { color: ADMIN_CHART_COLORS.text, precision: 0 },
        grid: { color: ADMIN_CHART_COLORS.grid },
      },
      y: {
        ticks: { color: ADMIN_CHART_COLORS.text },
        grid: { display: false },
      },
    },
    ...extra,
  };
}

export function adminDoughnutOptions(
  extra?: ChartOptions<"doughnut">,
): ChartOptions<"doughnut"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "62%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: ADMIN_CHART_COLORS.text,
          boxWidth: 10,
          usePointStyle: true,
          padding: 14,
        },
      },
      tooltip: adminTooltip,
    },
    ...extra,
  };
}

export function truncateChartLabel(value: string, max = 28): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

export function funnelConversionRate(current: number, previous: number): string {
  if (previous <= 0) return "—";
  return `${Math.round((current / previous) * 100)}% from previous step`;
}
