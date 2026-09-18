"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();

  // Do not show admin navigation on the login page.
  if (pathname === "/admin/login") {
    return null;
  }

  const logout = async () => {
    try {
      await fetch("/api/admin/login", {
        method: "DELETE",
      });
    } catch {
      // Continue to login even if request fails.
    }

    router.push("/admin/login");
    router.refresh();
  };

  const linkClass = (path: string) =>
    pathname === path ? "admin-nav-link active" : "admin-nav-link";

  return (
    <header className="admin-header">
      <div className="admin-header-inner">
        <Link href="/admin/vendors" className="admin-brand">
          <span className="admin-brand-small">SPARESCO</span>
          <span className="admin-brand-title">Admin Panel</span>
        </Link>

        <nav className="admin-nav">
          <Link
            href="/admin/vendors"
            className={linkClass("/admin/vendors")}
          >
            Vendors
          </Link>

          <Link
            href="/admin/vendor-products"
            className={linkClass("/admin/vendor-products")}
          >
            Vendor Products
          </Link>

          <Link
            href="/admin/enquiries"
            className={linkClass("/admin/enquiries")}
          >
            Enquiries
          </Link>

          <Link
            href="/admin/quotations"
            className={linkClass("/admin/quotations")}
          >
            Quotations
          </Link>

          <button
            type="button"
            onClick={logout}
            className="admin-logout"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}