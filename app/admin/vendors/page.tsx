"use client";

import { useEffect, useState } from "react";

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

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadVendors = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/vendors", {
        cache: "no-store",
      });

      const data = await response.json();

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

      {vendors.length === 0 ? (
        <div style={emptyStyle}>No vendor applications found.</div>
      ) : (
        <div style={listStyle}>
          {vendors.map((vendor) => (
            <section key={vendor.id} style={cardStyle}>
              <div style={cardHeaderStyle}>
                <div>
                  <h2 style={companyStyle}>{vendor.company_name}</h2>

                  <span style={vendorIdStyle}>
                    Vendor #{vendor.id}
                  </span>
                </div>

                <StatusBadge status={vendor.status} />
              </div>

              <div style={detailsGridStyle}>
                <div style={detailSectionStyle}>
                  <h3 style={sectionTitleStyle}>Contact Details</h3>

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

                <div style={detailSectionStyle}>
                  <h3 style={sectionTitleStyle}>Business Details</h3>

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

                <div style={productSectionStyle}>
                  <h3 style={sectionTitleStyle}>Product Access</h3>

                  <div style={productNumberStyle}>
                    {vendor.products_submitted}
                    <span style={productLimitStyle}>
                      {" "}
                      / {vendor.product_limit}
                    </span>
                  </div>

                  <div style={productTextStyle}>
                    products submitted
                  </div>

                  <div style={progressTrackStyle}>
                    <div
                      style={{
                        ...progressBarStyle,
                        width: `${Math.min(
                          100,
                          vendor.product_limit > 0
                            ? (vendor.products_submitted /
                                vendor.product_limit) *
                                100
                            : 0
                        )}%`,
                      }}
                    />
                  </div>
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
                      updateVendorStatus(vendor.id, "approved")
                    }
                    style={{
                      ...approveButtonStyle,
                      opacity:
                        vendor.status === "approved" ? 0.45 : 1,
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
                      updateVendorStatus(vendor.id, "rejected")
                    }
                    style={{
                      ...rejectButtonStyle,
                      opacity:
                        vendor.status === "rejected" ? 0.45 : 1,
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
        padding: "7px 12px",
        borderRadius: "999px",
        background,
        color,
        fontSize: "12px",
        fontWeight: 700,
        textTransform: "capitalize",
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

const companyStyle: React.CSSProperties = {
  margin: "0 0 4px",
  color: "#173f4c",
  fontSize: "20px",
};

const vendorIdStyle: React.CSSProperties = {
  color: "#879398",
  fontSize: "12px",
};

const detailsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 0.7fr",
  gap: "32px",
  padding: "24px",
};

const detailSectionStyle: React.CSSProperties = {
  minWidth: 0,
};

const productSectionStyle: React.CSSProperties = {
  minWidth: 0,
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
  letterSpacing: "0.04em",
  marginBottom: "3px",
};

const detailValueStyle: React.CSSProperties = {
  display: "block",
  color: "#43575d",
  fontSize: "14px",
  overflowWrap: "anywhere",
};

const productNumberStyle: React.CSSProperties = {
  color: "#173f4c",
  fontSize: "28px",
  fontWeight: 800,
};

const productLimitStyle: React.CSSProperties = {
  color: "#93a0a4",
  fontSize: "16px",
  fontWeight: 600,
};

const productTextStyle: React.CSSProperties = {
  color: "#718086",
  fontSize: "12px",
  marginTop: "2px",
};

const progressTrackStyle: React.CSSProperties = {
  width: "100%",
  height: "6px",
  background: "#edf1ef",
  borderRadius: "10px",
  overflow: "hidden",
  marginTop: "15px",
};

const progressBarStyle: React.CSSProperties = {
  height: "100%",
  background: "#2a8392",
  borderRadius: "10px",
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
  borderRadius: "14px",
  textAlign: "center",
  color: "#718086",
};