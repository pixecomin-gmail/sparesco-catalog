"use client";

import { useEffect, useMemo, useState } from "react";

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
  stock_quantity: number | null;
  application: string | null;
  godown_location: string | null;
  lead_time: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  company_name: string;
  contact_person: string;
  email: string;
};

type VendorGroup = {
  vendor_id: number;
  company_name: string;
  contact_person: string;
  email: string;
  products: VendorProduct[];
};

export default function AdminVendorProductsPage() {
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [openVendor, setOpenVendor] = useState<number | null>(null);
  const [openProduct, setOpenProduct] = useState<number | null>(null);

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

  const normalizeSearch = (value: unknown) => {
    return String(value || "")
      .toLowerCase()
      .replace(/[\s-]+/g, "");
  };

  const vendorGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    const normalizedQuery = normalizeSearch(search);

    const filteredProducts = products.filter((product) => {
      if (!query) return true;

      const fields = [
        product.product_name,
        product.part_number,
        product.brand,
        product.category,
        product.description,
        product.price,
        product.currency,
        product.stock_quantity,
        product.application,
        product.godown_location,
        product.lead_time,
        product.status,
        product.company_name,
        product.contact_person,
        product.email,
      ];

      const regularMatch = fields.some((field) =>
        String(field || "").toLowerCase().includes(query)
      );

      const normalizedMatch = fields.some((field) =>
        normalizeSearch(field).includes(normalizedQuery)
      );

      return regularMatch || normalizedMatch;
    });

    const groups = new Map<number, VendorGroup>();

    filteredProducts.forEach((product) => {
      const existing = groups.get(product.vendor_id);

      if (existing) {
        existing.products.push(product);
      } else {
        groups.set(product.vendor_id, {
          vendor_id: product.vendor_id,
          company_name: product.company_name,
          contact_person: product.contact_person,
          email: product.email,
          products: [product],
        });
      }
    });

    return Array.from(groups.values());
  }, [products, search]);

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

      <div style={searchWrapStyle}>
        <span style={searchIconStyle}>⌕</span>

        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setOpenProduct(null);
          }}
          placeholder="Search product, part number, vendor, brand, category..."
          style={searchInputStyle}
        />
      </div>

      {vendorGroups.length === 0 ? (
        <div style={emptyStyle}>
          {search
            ? "No vendor products match your search."
            : "No vendor products submitted yet."}
        </div>
      ) : (
        <div style={vendorListStyle}>
          {vendorGroups.map((vendor) => {
            const vendorOpen = openVendor === vendor.vendor_id;

            const pendingCount = vendor.products.filter(
              (product) => product.status?.toLowerCase() === "pending"
            ).length;

            const approvedCount = vendor.products.filter(
              (product) => product.status?.toLowerCase() === "approved"
            ).length;

            const rejectedCount = vendor.products.filter(
              (product) => product.status?.toLowerCase() === "rejected"
            ).length;

            return (
              <section key={vendor.vendor_id} style={vendorCardStyle}>
                <button
                  type="button"
                  onClick={() => {
                    setOpenVendor(
                      vendorOpen ? null : vendor.vendor_id
                    );

                    if (vendorOpen) {
                      setOpenProduct(null);
                    }
                  }}
                  style={vendorHeaderStyle}
                >
                  <span style={arrowStyle}>
                    {vendorOpen ? "▼" : "▶"}
                  </span>

                  <div style={vendorIdentityStyle}>
                    <strong style={vendorCompanyStyle}>
                      {vendor.company_name}
                    </strong>

                    <span style={vendorContactStyle}>
                      {vendor.contact_person || "—"}
                      {vendor.email ? ` • ${vendor.email}` : ""}
                    </span>
                  </div>

                  <div style={vendorStatsStyle}>
                    <span>
                      <strong>{vendor.products.length}</strong> Products
                    </span>

                    {pendingCount > 0 && (
                      <span>
                        <strong>{pendingCount}</strong> Pending
                      </span>
                    )}

                    {approvedCount > 0 && (
                      <span>
                        <strong>{approvedCount}</strong> Approved
                      </span>
                    )}

                    {rejectedCount > 0 && (
                      <span>
                        <strong>{rejectedCount}</strong> Rejected
                      </span>
                    )}
                  </div>
                </button>

                {vendorOpen && (
                  <div style={vendorProductsStyle}>
                    <div style={productTableHeaderStyle}>
                      <span></span>
                      <span>Product</span>
                      <span>Part Number</span>
                      <span>Brand</span>
                      <span>Status</span>
                    </div>

                    <div style={productListStyle}>
                      {vendor.products.map((product) => {
                        const productOpen =
                          openProduct === product.id;

                        return (
                          <section
                            key={product.id}
                            style={productCardStyle}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setOpenProduct(
                                  productOpen ? null : product.id
                                )
                              }
                              style={productRowStyle}
                            >
                              <span style={productArrowStyle}>
                                {productOpen ? "▼" : "▶"}
                              </span>

                              <div style={productSummaryStyle}>
                                <strong style={productNameStyle}>
                                  {product.product_name}
                                </strong>

                                <span style={productIdStyle}>
                                  Product #{product.id}
                                </span>
                              </div>

                              <span style={rowTextStyle}>
                                {product.part_number || "—"}
                              </span>

                              <span style={rowTextStyle}>
                                {product.brand || "—"}
                              </span>

                              <StatusBadge status={product.status} />
                            </button>

                            {productOpen && (
                              <div style={productExpandedStyle}>
                                <div style={detailsGridStyle}>
                                  <div>
                                    <h3 style={sectionTitleStyle}>
                                      Product Details
                                    </h3>

                                    <Detail
                                      label="Part Number"
                                      value={product.part_number || "—"}
                                    />

                                    <Detail
                                      label="Brand"
                                      value={product.brand || "—"}
                                    />

                                    <Detail
                                      label="Category"
                                      value={product.category || "—"}
                                    />

                                    {product.description && (
                                      <Detail
                                        label="Description"
                                        value={product.description}
                                      />
                                    )}
                                  </div>

                                  <div>
                                    <h3 style={sectionTitleStyle}>
                                      Vendor
                                    </h3>

                                    <Detail
                                      label="Company"
                                      value={product.company_name}
                                    />

                                    <Detail
                                      label="Contact"
                                      value={product.contact_person}
                                    />

                                    <Detail
                                      label="Email"
                                      value={product.email}
                                    />
                                  </div>

                                  <div style={availabilityStyle}>
                                    <h3 style={sectionTitleStyle}>
                                      Availability
                                    </h3>

                                    <Detail
                                      label="Price"
                                      value={
                                        product.price
                                          ? `${product.currency || ""} ${product.price}`
                                          : "—"
                                      }
                                    />

                                    <Detail
                                      label="Stock Quantity"
                                      value={
                                        product.stock_quantity !== null
                                          ? product.stock_quantity
                                          : "—"
                                      }
                                    />

                                    <Detail
                                      label="Application"
                                      value={product.application || "—"}
                                    />

                                    <Detail
                                      label="Godown Location"
                                      value={product.godown_location || "—"}
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
                                      ? new Date(
                                        product.created_at
                                      ).toLocaleDateString()
                                      : "—"}
                                  </span>

                                  <div style={actionsStyle}>
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
                                      style={{
                                        ...approveButtonStyle,
                                        opacity:
                                          product.status === "approved"
                                            ? 0.45
                                            : 1,
                                      }}
                                    >
                                      {updatingId === product.id
                                        ? "Updating..."
                                        : "Approve"}
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
                                      style={{
                                        ...rejectButtonStyle,
                                        opacity:
                                          product.status === "rejected"
                                            ? 0.45
                                            : 1,
                                      }}
                                    >
                                      Reject
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </section>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
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
        width: "fit-content",
        justifySelf: "start",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: "999px",
        background,
        color,
        fontSize: "11px",
        fontWeight: 700,
        textTransform: "capitalize",
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
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
  marginBottom: "22px",
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

const searchWrapStyle: React.CSSProperties = {
  position: "relative",
  marginBottom: "18px",
};

const searchIconStyle: React.CSSProperties = {
  position: "absolute",
  left: "13px",
  top: "50%",
  transform: "translateY(-50%)",
  color: "#819095",
  fontSize: "17px",
  pointerEvents: "none",
};

const searchInputStyle: React.CSSProperties = {
  width: "100%",
  height: "42px",
  padding: "0 14px 0 38px",
  border: "1px solid #d9e1df",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#173f4c",
  fontSize: "13px",
  outline: "none",
};

const vendorListStyle: React.CSSProperties = {
  display: "grid",
  gap: "10px",
};

const vendorCardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #dfe6e4",
  borderRadius: "10px",
  overflow: "hidden",
};

const vendorHeaderStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  background: "#ffffff",
  display: "grid",
  gridTemplateColumns: "24px minmax(280px, 1fr) auto",
  gap: "16px",
  alignItems: "center",
  padding: "16px 18px",
  textAlign: "left",
  cursor: "pointer",
};

const arrowStyle: React.CSSProperties = {
  color: "#2a8392",
  fontSize: "10px",
};

const vendorIdentityStyle: React.CSSProperties = {
  minWidth: 0,
};

const vendorCompanyStyle: React.CSSProperties = {
  display: "block",
  color: "#173f4c",
  fontSize: "14px",
};

const vendorContactStyle: React.CSSProperties = {
  display: "block",
  marginTop: "3px",
  color: "#879398",
  fontSize: "10px",
  overflowWrap: "anywhere",
};

const vendorStatsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  flexWrap: "wrap",
  gap: "16px",
  color: "#718086",
  fontSize: "10px",
};

const vendorProductsStyle: React.CSSProperties = {
  padding: "12px 16px 16px",
  background: "#f8faf9",
  borderTop: "1px solid #e7ecea",
};

const productTableHeaderStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "24px minmax(220px,1.6fr) minmax(150px,1fr) minmax(130px,0.8fr) 100px",
  gap: "14px",
  padding: "0 14px 7px",
  color: "#879398",
  fontSize: "9px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const productListStyle: React.CSSProperties = {
  display: "grid",
  gap: "7px",
};

const productCardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e0e6e4",
  borderRadius: "8px",
  overflow: "hidden",
};

const productRowStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  background: "#ffffff",
  display: "grid",
  gridTemplateColumns:
    "24px minmax(220px,1.6fr) minmax(150px,1fr) minmax(130px,0.8fr) 100px",
  gap: "14px",
  alignItems: "center",
  padding: "12px 14px",
  textAlign: "left",
  cursor: "pointer",
};

const productArrowStyle: React.CSSProperties = {
  color: "#2a8392",
  fontSize: "9px",
};

const productSummaryStyle: React.CSSProperties = {
  minWidth: 0,
};

const productNameStyle: React.CSSProperties = {
  display: "block",
  color: "#173f4c",
  fontSize: "12px",
  overflowWrap: "anywhere",
};

const productIdStyle: React.CSSProperties = {
  display: "block",
  marginTop: "2px",
  color: "#97a2a6",
  fontSize: "9px",
};

const rowTextStyle: React.CSSProperties = {
  color: "#53666c",
  fontSize: "11px",
  overflowWrap: "anywhere",
};

const productExpandedStyle: React.CSSProperties = {
  borderTop: "1px solid #e7ecea",
  background: "#fbfcfb",
};

const detailsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.2fr 1fr 0.8fr",
  gap: "32px",
  padding: "20px",
};

const availabilityStyle: React.CSSProperties = {
  paddingLeft: "24px",
  borderLeft: "1px solid #edf0ef",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 14px",
  color: "#173f4c",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const detailRowStyle: React.CSSProperties = {
  marginBottom: "11px",
};

const detailLabelStyle: React.CSSProperties = {
  display: "block",
  color: "#879398",
  fontSize: "9px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: "2px",
};

const detailValueStyle: React.CSSProperties = {
  display: "block",
  color: "#43575d",
  fontSize: "12px",
  overflowWrap: "anywhere",
};

const cardFooterStyle: React.CSSProperties = {
  padding: "12px 20px",
  background: "#ffffff",
  borderTop: "1px solid #edf0ef",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
};

const footerTextStyle: React.CSSProperties = {
  color: "#718086",
  fontSize: "11px",
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
  padding: "8px 14px",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
};

const rejectButtonStyle: React.CSSProperties = {
  border: "1px solid #d9dddd",
  background: "#ffffff",
  color: "#6c5552",
  borderRadius: "7px",
  padding: "8px 14px",
  fontSize: "11px",
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
  borderRadius: "10px",
  textAlign: "center",
  color: "#718086",
};