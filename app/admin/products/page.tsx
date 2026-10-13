import Link from "next/link";
import AdminProductsClient from "./AdminProductsClient";

export default function AdminProductsPage() {
  return (
    <main className="admin-dashboard">
      <div className="admin-page-heading">
        <div>
          <h1>Products</h1>
          <p>Manage your product catalogue.</p>
        </div>

        <Link
          href="/admin/products/new"
          className="admin-primary-button"
        >
          Add product
        </Link>
      </div>

      <AdminProductsClient />
    </main>
  );
}