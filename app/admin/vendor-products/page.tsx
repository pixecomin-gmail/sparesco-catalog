"use client";

import { useEffect, useState } from "react";

type VendorProduct = {
  id: number;
  vendor_id: number;
  product_name: string;
  part_number: string | null;
  brand: string | null;
  category: string | null;
  description: string | null;
  price: string | null;
  currency: string | null;
  stock_status: string | null;
  lead_time: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  company_name: string;
  contact_person: string;
  email: string;
};

export default function AdminVendorProductsPage() {
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadProducts = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/vendor-products", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to load vendor products.");
        return;
      }

      setProducts(data.products || []);
    } catch {
      setError("Unable to load vendor products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const updateProduct = async (
    id: number,
    status: "approved" | "rejected"
  ) => {
    setUpdatingId(id);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/admin/vendor-products/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to update product.");
        return;
      }

      setMessage(data.message || "Product updated.");

      setProducts((current) =>
        current.map((product) =>
          product.id === id
            ? {
                ...product,
                status,
              }
            : product
        )
      );
    } catch {
      setError("Unable to update product.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <main style={{ padding: "50px 24px" }}>
        <p>Loading vendor products...</p>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "50px 24px",
      }}
    >
      <div style={{ marginBottom: "30px" }}>
        <span
          style={{
            color: "#2a8392",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.1em",
          }}
        >
          SPARESCO ADMIN
        </span>

        <h1
          style={{
            margin: "10px 0 8px",
            color: "#173f4c",
          }}
        >
          Vendor Products
        </h1>

        <p
          style={{
            margin: 0,
            color: "#67797f",
          }}
        >
          Review products submitted by approved vendors.
        </p>
      </div>

      {message && (
        <div
          style={{
            marginBottom: "20px",
            padding: "12px 15px",
            borderRadius: "10px",
            background: "#eef8f3",
            border: "1px solid #d3ebdf",
            color: "#286647",
          }}
        >
          {message}
        </div>
      )}

      {error && (
        <div
          style={{
            marginBottom: "20px",
            padding: "12px 15px",
            borderRadius: "10px",
            background: "#fff3f1",
            border: "1px solid #f2d4d0",
            color: "#a23c35",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          overflowX: "auto",
          background: "#ffffff",
          border: "1px solid #e1e6e4",
          borderRadius: "16px",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "1100px",
          }}
        >
          <thead>
            <tr
              style={{
                background: "#f7f5ef",
                textAlign: "left",
              }}
            >
              {[
                "Product",
                "Part Number",
                "Brand",
                "Category",
                "Vendor",
                "Price",
                "Stock",
                "Lead Time",
                "Status",
                "Actions",
              ].map((heading) => (
                <th
                  key={heading}
                  style={{
                    padding: "14px 16px",
                    color: "#173f4c",
                    fontSize: "13px",
                    borderBottom: "1px solid #e1e6e4",
                  }}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  style={{
                    padding: "30px",
                    textAlign: "center",
                    color: "#718086",
                  }}
                >
                  No vendor products submitted yet.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id}>
                  <td
                    style={{
                      padding: "16px",
                      borderBottom: "1px solid #edf0ef",
                    }}
                  >
                    <strong
                      style={{
                        color: "#173f4c",
                      }}
                    >
                      {product.product_name}
                    </strong>
                  </td>

                  <td style={cellStyle}>
                    {product.part_number || "—"}
                  </td>

                  <td style={cellStyle}>
                    {product.brand || "—"}
                  </td>

                  <td style={cellStyle}>
                    {product.category || "—"}
                  </td>

                  <td style={cellStyle}>
                    <div>
                      <strong>{product.company_name}</strong>
                    </div>
                    <small>{product.email}</small>
                  </td>

                  <td style={cellStyle}>
                    {product.price
                      ? `${product.currency || ""} ${product.price}`
                      : "—"}
                  </td>

                  <td style={cellStyle}>
                    {product.stock_status || "—"}
                  </td>

                  <td style={cellStyle}>
                    {product.lead_time || "—"}
                  </td>

                  <td style={cellStyle}>
                    <strong>
                      {product.status}
                    </strong>
                  </td>

                  <td style={cellStyle}>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                      }}
                    >
                      <button
                        type="button"
                        disabled={
                          updatingId === product.id ||
                          product.status === "approved"
                        }
                        onClick={() =>
                          updateProduct(
                            product.id,
                            "approved"
                          )
                        }
                      >
                        Approve
                      </button>

                      <button
                        type="button"
                        disabled={
                          updatingId === product.id ||
                          product.status === "rejected"
                        }
                        onClick={() =>
                          updateProduct(
                            product.id,
                            "rejected"
                          )
                        }
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

const cellStyle: React.CSSProperties = {
  padding: "16px",
  borderBottom: "1px solid #edf0ef",
  color: "#4d6066",
  fontSize: "14px",
  verticalAlign: "top",
};