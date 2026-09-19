import AdminProductsClient from "./AdminProductsClient";

export const runtime = "edge";

export default function AdminProductsPage() {
  return (
    <main className="admin-dashboard">
      <div className="admin-page-heading">
        <div>
          <h1>Products</h1>
          <p>
            Search and manage products in the Sparesco catalogue.
          </p>
        </div>
      </div>

      <AdminProductsClient />
    </main>
  );
}