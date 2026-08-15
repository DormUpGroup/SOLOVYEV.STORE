import { BetaAnalyticsDataClient } from "@google-analytics/data";
import type { GaOverview } from "@/lib/analytics/ga-types";

export type { GaOverview } from "@/lib/analytics/ga-types";

function emptyOverview(days: number, error?: string): GaOverview {
  return {
    configured: false,
    error,
    days,
    realtimeActiveUsers: 0,
    activeUsers: 0,
    sessions: 0,
    pageViews: 0,
    sources: [],
    topPages: [],
  };
}

function normalizePrivateKey(raw: string): string {
  let key = raw.trim();
  // Vercel / copy-paste often keeps surrounding quotes as part of the value.
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }
  // dotenv may already expand \n; Vercel usually leaves them escaped.
  key = key.replace(/\\n/g, "\n").replace(/\\r/g, "");
  return key.trim();
}

function getCredentials(): {
  clientEmail: string;
  privateKey: string;
  propertyId: string;
} | null {
  const propertyId = (process.env.GA4_PROPERTY_ID || "").trim();

  const jsonRaw = (process.env.GA4_SERVICE_ACCOUNT_JSON || "").trim();
  if (jsonRaw) {
    try {
      const parsed = JSON.parse(jsonRaw) as {
        client_email?: string;
        private_key?: string;
      };
      const clientEmail = (parsed.client_email || "").trim();
      const privateKey = normalizePrivateKey(parsed.private_key || "");
      if (propertyId && clientEmail && privateKey) {
        return { clientEmail, privateKey, propertyId };
      }
    } catch {
      /* fall through to discrete env vars */
    }
  }

  const clientEmail = (process.env.GA4_CLIENT_EMAIL || "").trim();
  const privateKey = normalizePrivateKey(process.env.GA4_PRIVATE_KEY || "");

  if (!propertyId || !clientEmail || !privateKey) return null;
  return { clientEmail, privateKey, propertyId };
}

function metricValue(
  row: { metricValues?: Array<{ value?: string | null }> | null } | undefined,
  index: number,
): number {
  const raw = row?.metricValues?.[index]?.value;
  const n = Number(raw ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function isGa4Configured(): boolean {
  return getCredentials() != null;
}

export async function getGaOverview(days = 7): Promise<GaOverview> {
  const safeDays = Math.min(Math.max(Math.trunc(days) || 7, 1), 90);
  const creds = getCredentials();
  if (!creds) {
    return emptyOverview(
      safeDays,
      "Set GA4_PROPERTY_ID, GA4_CLIENT_EMAIL, and GA4_PRIVATE_KEY",
    );
  }

  const client = new BetaAnalyticsDataClient({
    credentials: {
      client_email: creds.clientEmail,
      private_key: creds.privateKey,
    },
  });
  const property = `properties/${creds.propertyId}`;
  const startDate = `${safeDays}daysAgo`;

  try {
    const [realtimeRes, summaryRes, sourcesRes, pagesRes] = await Promise.all([
      client.runRealtimeReport({
        property,
        metrics: [{ name: "activeUsers" }],
      }),
      client.runReport({
        property,
        dateRanges: [{ startDate, endDate: "today" }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
        ],
      }),
      client.runReport({
        property,
        dateRanges: [{ startDate, endDate: "today" }],
        dimensions: [{ name: "sessionSourceMedium" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 8,
      }),
      client.runReport({
        property,
        dateRanges: [{ startDate, endDate: "today" }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 8,
      }),
    ]);

    const summaryRow = summaryRes[0]?.rows?.[0];
    const sources = (sourcesRes[0]?.rows ?? []).map((row) => ({
      source: row.dimensionValues?.[0]?.value || "(unknown)",
      sessions: metricValue(row, 0),
    }));
    const topPages = (pagesRes[0]?.rows ?? []).map((row) => ({
      path: row.dimensionValues?.[0]?.value || "/",
      pageViews: metricValue(row, 0),
    }));

    return {
      configured: true,
      days: safeDays,
      realtimeActiveUsers: metricValue(realtimeRes[0]?.rows?.[0], 0),
      activeUsers: metricValue(summaryRow, 0),
      sessions: metricValue(summaryRow, 1),
      pageViews: metricValue(summaryRow, 2),
      sources,
      topPages,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch Google Analytics";
    console.error("[ga4] report failed:", message);
    return emptyOverview(safeDays, message);
  }
}
