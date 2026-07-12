import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminInternalLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-cms min-h-screen">{children}</div>;
}
