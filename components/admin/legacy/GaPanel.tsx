"use client";

import type { GaOverview } from "@/lib/analytics/ga-types";
import styles from "@/app/admin/admin.module.css";

interface GaPanelProps {
  data: GaOverview | null;
  compact?: boolean;
}

export function GaPanel({ data, compact = false }: GaPanelProps) {
  if (!data) {
    return (
      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <h3>Google Analytics</h3>
        </div>
        <div className={styles.panelBody}>
          <p className={styles.hint}>Loading GA…</p>
        </div>
      </div>
    );
  }

  if (!data.configured) {
    return (
      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <h3>Google Analytics</h3>
        </div>
        <div className={styles.panelBody}>
          <p className={styles.hint}>
            {data.error ||
              "Not configured. Add GA4_PROPERTY_ID, GA4_CLIENT_EMAIL, GA4_PRIVATE_KEY."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {compact ? (
        <div className={styles.panelHead} style={{ marginBottom: 8 }}>
          <h3>Google Analytics</h3>
        </div>
      ) : null}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Realtime users</div>
          <div className={styles.statValue}>{data.realtimeActiveUsers}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Users {data.days}d</div>
          <div className={styles.statValue}>{data.activeUsers}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Sessions {data.days}d</div>
          <div className={styles.statValue}>{data.sessions}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Page views {data.days}d</div>
          <div className={styles.statValue}>{data.pageViews}</div>
        </div>
      </div>

      {!compact ? (
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          }}
        >
          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <h3>Traffic sources</h3>
            </div>
            <div className={styles.panelBody}>
              {data.sources.length === 0 ? (
                <p className={styles.hint}>No source data yet.</p>
              ) : (
                data.sources.map((s) => (
                  <div
                    key={s.source}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "6px 0",
                      borderBottom: "1px solid #222",
                    }}
                  >
                    <span>{s.source}</span>
                    <span className={styles.hint}>{s.sessions}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <h3>Top pages</h3>
            </div>
            <div className={styles.panelBody}>
              {data.topPages.length === 0 ? (
                <p className={styles.hint}>No page data yet.</p>
              ) : (
                data.topPages.map((p) => (
                  <div
                    key={p.path}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "6px 0",
                      borderBottom: "1px solid #222",
                    }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p.path}
                    </span>
                    <span className={styles.hint}>{p.pageViews}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
