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

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

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
      const response = await fetch(`/api/admin/vendor-products/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to update product.");
        return;
      }

      setProducts((current) =>
        current.map((product) =>
          product.id === id ? { ...product, status } : product
        )
      );

      setMessage(`Product ${status} successfully.`);
    } catch {
      setError("Unable to update product.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <main style={pageStyle}>Loading vendor products...</main>;
  }

  return (
    <main style={pageStyle}>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={titleStyle}>Vendor Products</h1>
          <p style={subtitleStyle}>
            Review products submitted by vendors.
          </p>
        </div>

        <div style={countStyle}>
          {products.length} {products.length === 1 ? "Product" : "Products"}
        </div>
      </div>

      {message && <div style={successStyle}>{message}</div>}
      {error && <div style={errorStyle}>{error}</div>}

      {products.length === 0 ? (
        <div style={emptyStyle}>No vendor products submitted yet.</div>
      ) : (
        <div style={listStyle}>
          {products.map((product) => (
            <section key={product.id} style={cardStyle}>
              <div style={cardHeaderStyle}>
                <div>
                  <h2 style={productTitleStyle}>{product.product_name}</h2>

                  <span style={smallTextStyle}>
                    Product #{product.id}
                    {product.part_number
                      ? ` • Part No. ${product.part_number}`
                      : ""}
                  </span>
                </div>

                <StatusBadge status={product.status} />
              </div>

              <div style={detailsGridStyle}>
                <div>
                  <h3 style={sectionTitleStyle}>Product Details</h3>

                  <Detail label="Part Number" value={product.part_number || "—"} />
                  <Detail label="Brand" value={product.brand || "—"} />
                  <Detail label="Category" value={product.category || "—"} />

                  {product.description && (
                    <Detail label="Description" value={product.description} />
                  )}
                </div>

                <div>
                  <h3 style={sectionTitleStyle}>Vendor</h3>

                  <Detail label="Company" value={product.company_name} />
                  <Detail label="Contact" value={product.contact_person} />
                  <Detail label="Email" value={product.email} />
                </div>

                <div style={availabilityStyle}>
                  <h3 style={sectionTitleStyle}>Availability</h3>

                  <Detail
                    label="Price"
                    value={
                      product.price
                        ? `${product.currency || ""} ${product.price}`
                        : "—"
                    }
                  />

                  <Detail
                    label="Stock"
                    value={formatStock(product.stock_status)}
                  />

                  <Detail
                    label="Lead Time"
                    value={product.lead_time || "—"}
                  />
                </div>
              </div>

              <div style={cardFooterStyle}>
                <span style={footerTextStyle}>
                  Submitted{" "}
                  {product.created_at
                    ? new Date(product.created_at).toLocaleDateString()
                    : "—"}
                </span>

                <div style={actionsStyle}>
                  <button
                    type="button"
                    disabled={
                      updatingId === product.id ||
                      product.status === "approved"
                    }
                    onClick={() => updateProduct(product.id, "approved")}
                    style={{
                      ...approveButtonStyle,
                      opacity: product.status === "approved" ? 0.45 : 1,
                    }}
                  >
                    Approve
                  </button>

                  <button
                    type="button"
                    disabled={
                      updatingId === product.id ||
                      product.status === "rejected"
                    }
                    onClick={() => updateProduct(product.id, "rejected")}
                    style={{
                      ...rejectButtonStyle,
                      opacity: product.status === "rejected" ? 0.45 : 1,
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div style={detailRowStyle}>
      <span style={detailLabelStyle}>{label}</span>
      <span style={detailValueStyle}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status?.toLowerCase();

  let background = "#fff7df";
  let color = "#886818";

  if (normalized === "approved") {
    background = "#eaf6ef";
    color = "#286647";
  }

  if (normalized === "rejected") {
    background = "#fff0ee";
    color = "#a23c35";
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px 12px",
        borderRadius: "20px",
        background,
        color,
        fontSize: "12px",
        lineHeight: "1",
        fontWeight: 700,
        textTransform: "capitalize",
        whiteSpace: "nowrap",
        width: "fit-content",
        height: "fit-content",
      }}
    >
      {status}
    </span>
  );
}

function formatStock(value: string | null) {
  if (!value) return "—";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const pageStyle: React.CSSProperties = {
  maxWidth: "1250px",
  margin: "0 auto",
  padding: "42px 24px 70px",
};

const pageHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  marginBottom: "28px",
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 7px",
  color: "#173f4c",
  fontSize: "32px",
};

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#67797f",
};

const countStyle: React.CSSProperties = {
  padding: "9px 14px",
  background: "#ffffff",
  border: "1px solid #dfe6e4",
  borderRadius: "9px",
  color: "#173f4c",
  fontSize: "13px",
  fontWeight: 700,
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: "18px",
};

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #dfe6e4",
  borderRadius: "14px",
  overflow: "hidden",
};

const cardHeaderStyle: React.CSSProperties = {
  padding: "22px 24px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  borderBottom: "1px solid #edf0ef",
};

const productTitleStyle: React.CSSProperties = {
  margin: "0 0 5px",
  color: "#173f4c",
  fontSize: "20px",
};

const smallTextStyle: React.CSSProperties = {
  color: "#879398",
  fontSize: "12px",
};

const detailsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.2fr 1fr 0.8fr",
  gap: "32px",
  padding: "24px",
};

const availabilityStyle: React.CSSProperties = {
  paddingLeft: "24px",
  borderLeft: "1px solid #edf0ef",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 16px",
  color: "#173f4c",
  fontSize: "14px",
};

const detailRowStyle: React.CSSProperties = {
  marginBottom: "12px",
};

const detailLabelStyle: React.CSSProperties = {
  display: "block",
  color: "#879398",
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  marginBottom: "3px",
};

const detailValueStyle: React.CSSProperties = {
  color: "#43575d",
  fontSize: "14px",
  overflowWrap: "anywhere",
};

const cardFooterStyle: React.CSSProperties = {
  padding: "15px 24px",
  background: "#fbfbf9",
  borderTop: "1px solid #edf0ef",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
};

const footerTextStyle: React.CSSProperties = {
  color: "#718086",
  fontSize: "13px",
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  gap: "9px",
};

const approveButtonStyle: React.CSSProperties = {
  border: "none",
  background: "#173f4c",
  color: "#ffffff",
  borderRadius: "7px",
  padding: "9px 15px",
  fontWeight: 700,
  cursor: "pointer",
};

const rejectButtonStyle: React.CSSProperties = {
  border: "1px solid #d9dddd",
  background: "#ffffff",
  color: "#6c5552",
  borderRadius: "7px",
  padding: "9px 15px",
  fontWeight: 700,
  cursor: "pointer",
};

const successStyle: React.CSSProperties = {
  marginBottom: "18px",
  padding: "12px 15px",
  background: "#eef8f3",
  border: "1px solid #d3ebdf",
  borderRadius: "9px",
  color: "#286647",
};

const errorStyle: React.CSSProperties = {
  ...successStyle,
  background: "#fff3f1",
  border: "1px solid #f2d4d0",
  color: "#a23c35",
};

const emptyStyle: React.CSSProperties = {
  padding: "50px",
  background: "#ffffff",
  border: "1px solid #dfe6e4",
  borderRadius: "14px",
  textAlign: "center",
  color: "#718086",
};