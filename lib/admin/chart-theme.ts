import type { ChartOptions } from "chart.js";

export const ADMIN_CHART_COLORS = {
  primary: "#0a84ff",
  success: "#30d158",
  muted: "#98989d",
  grid: "rgba(255,255,255,0.06)",
  text: "#98989d",
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
      tooltip: {
        backgroundColor: "#1c1c1e",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        titleColor: "#f5f5f7",
        bodyColor: "#98989d",
        padding: 12,
        cornerRadius: 10,
      },
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
