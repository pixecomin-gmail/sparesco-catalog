"use client";

import { useEffect, useMemo, useState } from "react";

type Vendor = {
  id: number;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  gst_number: string;
  status: string;
  product_limit: number;
  products_submitted: number;
  created_at: string;
};

type SortOption = "newest" | "product_limit";

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [openVendor, setOpenVendor] = useState<number | null>(null);

  const loadVendors = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/vendors", {
        cache: "no-store",
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (!response.ok) {
        setError(data.error || "Unable to load vendors.");
        return;
      }

      setVendors(data.vendors || []);
    } catch {
      setError("Unable to load vendors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const updateVendorStatus = async (
    vendorId: number,
    status: "approved" | "rejected"
  ) => {
    setUpdatingId(vendorId);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to update vendor.");
        return;
      }

      setVendors((current) =>
        current.map((vendor) =>
          vendor.id === vendorId ? { ...vendor, status } : vendor
        )
      );

      setMessage(`Vendor ${status} successfully.`);
    } catch {
      setError("Unable to update vendor.");
    } finally {
      setUpdatingId(null);
    }
  };

  const increaseProductLimit = async (vendorId: number) => {
    setUpdatingId(vendorId);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "increase_limit",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to increase product limit.");
        return;
      }

      setVendors((current) =>
        current.map((vendor) =>
          vendor.id === vendorId
            ? {
              ...vendor,
              product_limit:
                data.product_limit ?? vendor.product_limit + 10,
            }
            : vendor
        )
      );

      setMessage("Vendor product limit increased by 10.");
    } catch {
      setError("Unable to increase product limit.");
    } finally {
      setUpdatingId(null);
    }
  };

  const visibleVendors = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = vendors.filter((vendor) => {
      if (!query) return true;

      const searchable = [
        vendor.company_name,
        vendor.contact_person,
        vendor.email,
        vendor.phone,
        vendor.city,
        vendor.country,
        vendor.gst_number,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "product_limit") {
        const aUsage =
          a.product_limit > 0
            ? a.products_submitted / a.product_limit
            : 0;

        const bUsage =
          b.product_limit > 0
            ? b.products_submitted / b.product_limit
            : 0;

        // Highest percentage of product limit used first.
        if (bUsage !== aUsage) {
          return bUsage - aUsage;
        }

        // If percentage is the same, vendor using more
        // product slots appears first.
        if (b.products_submitted !== a.products_submitted) {
          return b.products_submitted - a.products_submitted;
        }
      }

      const aTime = new Date(a.created_at).getTime() || 0;
      const bTime = new Date(b.created_at).getTime() || 0;

      if (bTime !== aTime) {
        return bTime - aTime;
      }

      return b.id - a.id;
    });
  }, [vendors, search, sortBy]);

  if (loading) {
    return (
      <main style={pageStyle}>
        <p>Loading vendors...</p>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={titleStyle}>Vendors</h1>
          <p style={subtitleStyle}>
            Review and manage vendor registrations.
          </p>
        </div>

        <div style={countStyle}>
          {vendors.length} {vendors.length === 1 ? "Vendor" : "Vendors"}
        </div>
      </div>

      {message && <div style={successStyle}>{message}</div>}
      {error && <div style={errorStyle}>{error}</div>}

      <div style={toolbarStyle}>
        <div style={searchWrapStyle}>
          <span style={searchIconStyle}>⌕</span>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search vendor details..."
            style={searchInputStyle}
          />
        </div>

        <select
          value={sortBy}
          onChange={(event) =>
            setSortBy(event.target.value as SortOption)
          }
          style={sortSelectStyle}
        >
          <option value="newest">Newest First</option>
          <option value="product_limit">Product Limit</option>
        </select>
      </div>

      {visibleVendors.length === 0 ? (
        <div style={emptyStyle}>
          {search
            ? "No vendors match your search."
            : "No vendor applications found."}
        </div>
      ) : (
        <>
          <div style={tableHeaderStyle}>
            <span></span>
            <span>Vendor</span>
            <span>Contact</span>
            <span>Location</span>
            <span>Product Limit</span>
            <span>Status</span>
          </div>

          <div style={listStyle}>
            {visibleVendors.map((vendor) => {
              const isOpen = openVendor === vendor.id;

              const usage =
                vendor.product_limit > 0
                  ? Math.min(
                    100,
                    Math.round(
                      (vendor.products_submitted /
                        vendor.product_limit) *
                      100
                    )
                  )
                  : 0;

              return (
                <section
                  key={vendor.id}
                  style={{
                    ...cardStyle,
                    ...(isOpen ? openCardStyle : {}),
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenVendor(isOpen ? null : vendor.id)
                    }
                    style={vendorRowStyle}
                  >
                    <span style={arrowStyle}>
                      {isOpen ? "▼" : "▶"}
                    </span>

                    <div style={vendorSummaryStyle}>
                      <strong style={companyStyle}>
                        {vendor.company_name}
                      </strong>

                      <span style={vendorIdStyle}>
                        Vendor #{vendor.id}
                      </span>
                    </div>

                    <span style={summaryTextStyle}>
                      {vendor.contact_person || "—"}
                    </span>

                    <span style={summaryTextStyle}>
                      {[vendor.city, vendor.country]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </span>

                    <strong style={limitSummaryStyle}>
                      {vendor.products_submitted}/{vendor.product_limit}
                    </strong>

                    <StatusBadge status={vendor.status} />
                  </button>

                  {isOpen && (
                    <div style={expandedStyle}>


                      <div style={detailsGridStyle}>
                        <div>
                          <h3 style={sectionTitleStyle}>
                            Contact Details
                          </h3>

                          <Detail
                            label="Contact Person"
                            value={vendor.contact_person}
                          />

                          <Detail label="Email" value={vendor.email} />

                          <Detail
                            label="Phone"
                            value={vendor.phone || "—"}
                          />
                        </div>

                        <div>
                          <h3 style={sectionTitleStyle}>
                            Business Details
                          </h3>

                          <Detail
                            label="Location"
                            value={
                              [vendor.city, vendor.country]
                                .filter(Boolean)
                                .join(", ") || "—"
                            }
                          />

                          <Detail
                            label="GST / Tax"
                            value={vendor.gst_number || "—"}
                          />

                          <Detail
                            label="Registered"
                            value={
                              vendor.created_at
                                ? new Date(
                                  vendor.created_at
                                ).toLocaleDateString()
                                : "—"
                            }
                          />
                        </div>

                        <div style={productAccessSectionStyle}>
                          <h3 style={sectionTitleStyle}>
                            Product Access
                          </h3>

                          <div style={productAccessTopStyle}>
                            <strong style={productAccessNumberStyle}>
                              {vendor.products_submitted} / {vendor.product_limit}
                            </strong>

                            <strong style={percentageStyle}>
                              {usage}%
                            </strong>
                          </div>

                          <div style={compactProgressTrackStyle}>
                            <div
                              style={{
                                ...compactProgressBarStyle,
                                width: `${usage}%`,
                              }}
                            />
                          </div>

                          <button
                            type="button"
                            disabled={updatingId === vendor.id}
                            onClick={() => increaseProductLimit(vendor.id)}
                            style={{
                              ...increaseLimitButtonStyle,
                              opacity: updatingId === vendor.id ? 0.5 : 1,
                            }}
                          >
                            {updatingId === vendor.id
                              ? "Updating..."
                              : "+10 Products"}
                          </button>
                        </div>
                      </div>

                      <div style={cardFooterStyle}>
                        <span style={footerTextStyle}>
                          Application status:{" "}
                          <strong
                            style={{
                              textTransform: "capitalize",
                              color: "#173f4c",
                            }}
                          >
                            {vendor.status}
                          </strong>
                        </span>

                        <div style={actionsStyle}>
                          <button
                            type="button"
                            disabled={
                              updatingId === vendor.id ||
                              vendor.status === "approved"
                            }
                            onClick={() =>
                              updateVendorStatus(
                                vendor.id,
                                "approved"
                              )
                            }
                            style={{
                              ...approveButtonStyle,
                              opacity:
                                vendor.status === "approved"
                                  ? 0.45
                                  : 1,
                            }}
                          >
                            {updatingId === vendor.id
                              ? "Updating..."
                              : "Approve"}
                          </button>

                          <button
                            type="button"
                            disabled={
                              updatingId === vendor.id ||
                              vendor.status === "rejected"
                            }
                            onClick={() =>
                              updateVendorStatus(
                                vendor.id,
                                "rejected"
                              )
                            }
                            style={{
                              ...rejectButtonStyle,
                              opacity:
                                vendor.status === "rejected"
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
        </>
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
  alignItems: "center",
  justifyContent: "space-between",
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

const toolbarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "18px",
};

const searchWrapStyle: React.CSSProperties = {
  flex: 1,
  position: "relative",
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

const sortSelectStyle: React.CSSProperties = {
  height: "42px",
  minWidth: "165px",
  padding: "0 12px",
  border: "1px solid #d9e1df",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#173f4c",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
};

const tableHeaderStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "24px minmax(220px,1.7fr) minmax(140px,1fr) minmax(140px,1fr) 110px 100px",
  gap: "16px",
  padding: "0 18px 8px",
  color: "#879398",
  fontSize: "9px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: "9px",
};

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #dfe6e4",
  borderRadius: "10px",
  overflow: "hidden",
};

const openCardStyle: React.CSSProperties = {
  borderColor: "#bfd3d5",
  boxShadow: "0 3px 12px rgba(23,63,76,0.05)",
};

const vendorRowStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  background: "#ffffff",
  display: "grid",
  gridTemplateColumns:
    "24px minmax(220px,1.7fr) minmax(140px,1fr) minmax(140px,1fr) 110px 100px",
  gap: "16px",
  alignItems: "center",
  padding: "14px 18px",
  textAlign: "left",
  cursor: "pointer",
};

const arrowStyle: React.CSSProperties = {
  color: "#2a8392",
  fontSize: "10px",
};

const vendorSummaryStyle: React.CSSProperties = {
  minWidth: 0,
};

const companyStyle: React.CSSProperties = {
  display: "block",
  color: "#173f4c",
  fontSize: "13px",
  overflowWrap: "anywhere",
};

const vendorIdStyle: React.CSSProperties = {
  display: "block",
  marginTop: "2px",
  color: "#93a0a4",
  fontSize: "9px",
};

const summaryTextStyle: React.CSSProperties = {
  color: "#53666c",
  fontSize: "12px",
  overflowWrap: "anywhere",
};

const limitSummaryStyle: React.CSSProperties = {
  color: "#173f4c",
  fontSize: "13px",
};

const expandedStyle: React.CSSProperties = {
  borderTop: "1px solid #e5ebe9",
  background: "#fbfcfb",
};

const productAccessSectionStyle: React.CSSProperties = {
  paddingLeft: "24px",
  borderLeft: "1px solid #e2e8e6",
};

const productAccessTopStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "8px",
};

const productAccessNumberStyle: React.CSSProperties = {
  color: "#173f4c",
  fontSize: "14px",
};

const compactProgressTrackStyle: React.CSSProperties = {
  width: "100%",
  height: "5px",
  background: "#e4ebe9",
  borderRadius: "10px",
  overflow: "hidden",
};

const compactProgressBarStyle: React.CSSProperties = {
  height: "100%",
  background: "#2a8392",
  borderRadius: "10px",
};

const percentageStyle: React.CSSProperties = {
  color: "#718086",
  fontSize: "11px",
};

const increaseLimitButtonStyle: React.CSSProperties = {
  marginTop: "12px",
  border: "1px solid #2a8392",
  background: "#ffffff",
  color: "#2a8392",
  borderRadius: "7px",
  padding: "7px 11px",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const detailsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 280px",
  gap: "48px",
  padding: "20px 18px 16px",
  alignItems: "start",
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
  padding: "13px 18px",
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
  marginBottom: "18px",
  padding: "12px 15px",
  background: "#fff3f1",
  border: "1px solid #f2d4d0",
  borderRadius: "9px",
  color: "#a23c35",
};

const emptyStyle: React.CSSProperties = {
  padding: "50px",
  background: "#ffffff",
  border: "1px solid #dfe6e4",
  borderRadius: "12px",
  textAlign: "center",
  color: "#718086",
};