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

  const isHome = pathname === "/admin";
  const isProducts = pathname === "/admin/products" || pathname.startsWith("/admin/products/");

  const isVendors =
    pathname === "/admin/pending-actions" ||
    pathname.startsWith("/admin/pending-actions/") ||
    pathname === "/admin/vendors" ||
    pathname.startsWith("/admin/vendors/") ||
    pathname === "/admin/vendor-products" ||
    pathname.startsWith("/admin/vendor-products/") ||
    pathname === "/admin/enquiries" ||
    pathname.startsWith("/admin/enquiries/") ||
    pathname === "/admin/enquiry-email-list" ||
    pathname.startsWith("/admin/enquiry-email-list/") ||
    pathname === "/admin/quotations" ||
    pathname.startsWith("/admin/quotations/");

  const subLinkClass = (path: string) =>
    pathname === path
      ? "admin-subnav-link active"
      : "admin-subnav-link";

  return (
    <>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-inner">
          <Link href="/admin" className="admin-brand">
            <span className="admin-brand-small">
              SPARESCO
            </span>

            <span className="admin-brand-title">
              Admin Panel
            </span>
          </Link>

          <nav className="admin-main-nav">
            <Link href="/admin/products" className={`admin-main-nav-link ${isProducts ? "active" : ""}`}>
              Products
            </Link>

            <Link
              href="/admin"
              className={`admin-main-nav-link ${isHome ? "active" : ""
                }`}
            >
              Home
            </Link>


            <Link 
              href="/admin/pending-actions" 
              className={`admin-main-nav-link ${isVendors ? "active" : "" 
                }`} 
            > 
              Vendors 
            </Link>

            <button
              type="button"
              onClick={logout}
              className="admin-main-nav-link admin-sidebar-logout"
            >
              Logout
            </button>
          </nav>
        </div>
      </aside>

      <header className="admin-header">
        <div className="admin-header-inner">
          {isVendors && (
            <nav className="admin-subnav">
              <Link
                href="/admin/pending-actions"
                className={subLinkClass(
                  "/admin/pending-actions"
                )}
              >
                Pending Actions
              </Link>

              <Link
                href="/admin/vendors"
                className={subLinkClass(
                  "/admin/vendors"
                )}
              >
                Vendors
              </Link>

              <Link
                href="/admin/vendor-products"
                className={subLinkClass(
                  "/admin/vendor-products"
                )}
              >
                Vendor Products
              </Link>

              <Link
                href="/admin/enquiries"
                className={subLinkClass(
                  "/admin/enquiries"
                )}
              >
                Enquiries
              </Link>

              <Link
                href="/admin/enquiry-email-list"
                className={subLinkClass(
                  "/admin/enquiry-email-list"
                )}
              >
                Enquiry Email List
              </Link>
            </nav>
          )}
        </div>
      </header>
    </>
  );
}