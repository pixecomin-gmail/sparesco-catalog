import type { ReactNode } from "react";
import AdminHeader from "./AdminHeader";
import "./admin.css";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="admin-area">
      <AdminHeader />

      <div className="admin-content">
        {children}
      </div>
    </div>
  );
}