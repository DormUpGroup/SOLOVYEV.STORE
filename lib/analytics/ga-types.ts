export type GaOverview = {
  configured: boolean;
  error?: string;
  days: number;
  realtimeActiveUsers: number;
  activeUsers: number;
  sessions: number;
  pageViews: number;
  sources: Array<{ source: string; sessions: number }>;
  topPages: Array<{ path: string; pageViews: number }>;
};
