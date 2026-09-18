"use client";

import { useEffect, useMemo, useState } from "react";

type Enquiry = {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  company_name: string | null;
  product_name: string | null;
  part_number: string | null;
  product_handle: string | null;
  quantity: string | null;
  message: string | null;
  status: string;
  created_at: string;
  matched_vendors: number;
  responded_vendors: number;
};

type Filter = "all" | "open" | "closed";

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [openEnquiry, setOpenEnquiry] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    loadEnquiries();
  }, []);

  async function loadEnquiries() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/enquiries", {
        cache: "no-store",
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (!response.ok) {
        setError(data.error || "Unable to load enquiries.");
        return;
      }

      setEnquiries(data.enquiries || []);
    } catch {
      setError("Unable to load enquiries.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(
    enquiryId: number,
    status: "open" | "closed"
  ) {
    setUpdatingId(enquiryId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/enquiries/${enquiryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (!response.ok) {
        setError(data.error || "Unable to update enquiry.");
        return;
      }

      setEnquiries((current) =>
        current.map((enquiry) =>
          enquiry.id === enquiryId
            ? { ...enquiry, status }
            : enquiry
        )
      );

      setMessage(data.message || "Enquiry updated successfully.");
    } catch {
      setError("Unable to update enquiry.");
    } finally {
      setUpdatingId(null);
    }
  }

  const visibleEnquiries = useMemo(() => {
    if (filter === "all") {
      return enquiries;
    }

    if (filter === "closed") {
      return enquiries.filter(
        (enquiry) => enquiry.status?.toLowerCase() === "closed"
      );
    }

    return enquiries.filter(
      (enquiry) => enquiry.status?.toLowerCase() !== "closed"
    );
  }, [enquiries, filter]);

  if (loading) {
    return <main style={pageStyle}>Loading enquiries...</main>;
  }

  return (
    <main style={pageStyle}>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={titleStyle}>Enquiries</h1>

          <p style={subtitleStyle}>
            Review customer enquiries and control whether they remain open
            for vendor matching.
          </p>
        </div>

        <div style={countStyle}>
          {enquiries.length}{" "}
          {enquiries.length === 1 ? "Enquiry" : "Enquiries"}
        </div>
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      {message && <div style={successStyle}>{message}</div>}

      <div style={filtersStyle}>
        {(["all", "open", "closed"] as Filter[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            style={{
              ...filterButtonStyle,
              ...(filter === item ? activeFilterStyle : {}),
            }}
          >
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      {visibleEnquiries.length === 0 ? (
        <div style={emptyStyle}>No enquiries found.</div>
      ) : (
        <div style={listStyle}>
          {visibleEnquiries.map((enquiry) => {
            const expanded = openEnquiry === enquiry.id;
            const isClosed =
              enquiry.status?.toLowerCase() === "closed";

            return (
              <section key={enquiry.id} style={cardStyle}>
                <div style={summaryStyle}>
                  <div style={enquiryNumberStyle}>
                    #{enquiry.id}
                  </div>

                  <div style={mainInfoStyle}>
                    <strong style={productStyle}>
                      {enquiry.product_name || "Product"}
                    </strong>

                    <span style={smallStyle}>
                      {enquiry.part_number
                        ? `Part No. ${enquiry.part_number}`
                        : "No part number"}
                    </span>
                  </div>

                  <div style={summaryBlockStyle}>
                    <span style={labelStyle}>Customer</span>
                    <strong>{enquiry.customer_name || "—"}</strong>
                  </div>

                  <div style={summaryBlockStyle}>
                    <span style={labelStyle}>Quantity</span>
                    <strong>{enquiry.quantity || "—"}</strong>
                  </div>

                  <div style={summaryBlockStyle}>
                    <span style={labelStyle}>Vendors</span>
                    <strong>{Number(enquiry.matched_vendors || 0)}</strong>
                  </div>

                  <StatusBadge status={enquiry.status} />

                  <button
                    type="button"
                    onClick={() =>
                      setOpenEnquiry(expanded ? null : enquiry.id)
                    }
                    style={viewButtonStyle}
                  >
                    {expanded ? "Close Details" : "View Details"}
                  </button>
                </div>

                {expanded && (
                  <div style={expandedStyle}>
                    <div style={detailGridStyle}>
                      <DetailSection title="Customer">
                        <Detail
                          label="Name"
                          value={enquiry.customer_name || "—"}
                        />

                        <Detail
                          label="Company"
                          value={enquiry.company_name || "—"}
                        />

                        <Detail
                          label="Email"
                          value={enquiry.customer_email || "—"}
                        />

                        <Detail
                          label="Phone"
                          value={enquiry.customer_phone || "—"}
                        />
                      </DetailSection>

                      <DetailSection title="Product">
                        <Detail
                          label="Product"
                          value={enquiry.product_name || "—"}
                        />

                        <Detail
                          label="Part Number"
                          value={enquiry.part_number || "—"}
                        />

                        <Detail
                          label="Quantity"
                          value={enquiry.quantity || "—"}
                        />

                        <Detail
                          label="Product Handle"
                          value={enquiry.product_handle || "—"}
                        />
                      </DetailSection>

                      <DetailSection title="Vendor Matching">
                        <Detail
                          label="Matched Vendors"
                          value={Number(
                            enquiry.matched_vendors || 0
                          )}
                        />

                        <Detail
                          label="Responded Vendors"
                          value={Number(
                            enquiry.responded_vendors || 0
                          )}
                        />

                        <Detail
                          label="Enquiry Status"
                          value={isClosed ? "Closed" : "Open"}
                        />

                        <Detail
                          label="Received"
                          value={formatDate(enquiry.created_at)}
                        />
                      </DetailSection>
                    </div>

                    {enquiry.message && (
                      <div style={messageBoxStyle}>
                        <span style={labelStyle}>
                          Customer Message
                        </span>

                        <div style={messageTextStyle}>
                          {enquiry.message}
                        </div>
                      </div>
                    )}

                    <div style={actionRowStyle}>
                      <div>
                        <span style={labelStyle}>Enquiry Status</span>
                        <StatusBadge status={enquiry.status} />
                      </div>

                      {isClosed ? (
                        <button
                          type="button"
                          disabled={updatingId === enquiry.id}
                          onClick={() =>
                            updateStatus(enquiry.id, "open")
                          }
                          style={{
                            ...openButtonStyle,
                            opacity:
                              updatingId === enquiry.id ? 0.5 : 1,
                          }}
                        >
                          {updatingId === enquiry.id
                            ? "Updating..."
                            : "Reopen Enquiry"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={updatingId === enquiry.id}
                          onClick={() =>
                            updateStatus(enquiry.id, "closed")
                          }
                          style={{
                            ...closeButtonStyle,
                            opacity:
                              updatingId === enquiry.id ? 0.5 : 1,
                          }}
                        >
                          {updatingId === enquiry.id
                            ? "Updating..."
                            : "Close Enquiry"}
                        </button>
                      )}
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

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 style={sectionTitleStyle}>{title}</h3>
      {children}
    </div>
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
    <div style={detailStyle}>
      <span style={labelStyle}>{label}</span>
      <span style={valueStyle}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const closed = status?.toLowerCase() === "closed";

  return (
    <span
      style={{
        padding: "7px 12px",
        borderRadius: "999px",
        background: closed ? "#fff0ee" : "#eaf6ef",
        color: closed ? "#a23c35" : "#286647",
        fontSize: "12px",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {closed ? "Closed" : "Open"}
    </span>
  );
}

function formatDate(value: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
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
  marginBottom: "24px",
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

const filtersStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  marginBottom: "20px",
};

const filterButtonStyle: React.CSSProperties = {
  border: "1px solid #d9e1df",
  background: "#ffffff",
  color: "#617278",
  borderRadius: "8px",
  padding: "8px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const activeFilterStyle: React.CSSProperties = {
  background: "#173f4c",
  borderColor: "#173f4c",
  color: "#ffffff",
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: "12px",
};

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #dfe6e4",
  borderRadius: "12px",
  overflow: "hidden",
};

const summaryStyle: React.CSSProperties = {
  padding: "18px 20px",
  display: "grid",
  gridTemplateColumns:
    "50px minmax(180px, 1.5fr) minmax(130px, 1fr) 80px 80px auto auto",
  alignItems: "center",
  gap: "18px",
};

const enquiryNumberStyle: React.CSSProperties = {
  color: "#2a8392",
  fontWeight: 800,
};

const mainInfoStyle: React.CSSProperties = {
  minWidth: 0,
};

const productStyle: React.CSSProperties = {
  display: "block",
  color: "#173f4c",
  marginBottom: "4px",
};

const smallStyle: React.CSSProperties = {
  color: "#879398",
  fontSize: "12px",
};

const summaryBlockStyle: React.CSSProperties = {
  color: "#43575d",
  fontSize: "13px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "#879398",
  fontSize: "10px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: "3px",
};

const viewButtonStyle: React.CSSProperties = {
  border: "1px solid #ccd7d8",
  background: "#ffffff",
  color: "#173f4c",
  borderRadius: "7px",
  padding: "8px 12px",
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const expandedStyle: React.CSSProperties = {
  borderTop: "1px solid #edf0ef",
  padding: "24px",
  background: "#fbfbf9",
};

const detailGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: "40px",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 16px",
  color: "#173f4c",
  fontSize: "14px",
};

const detailStyle: React.CSSProperties = {
  marginBottom: "12px",
};

const valueStyle: React.CSSProperties = {
  color: "#43575d",
  fontSize: "13px",
  overflowWrap: "anywhere",
};

const messageBoxStyle: React.CSSProperties = {
  marginTop: "20px",
  padding: "15px",
  background: "#ffffff",
  border: "1px solid #e4e9e7",
  borderRadius: "8px",
};

const messageTextStyle: React.CSSProperties = {
  marginTop: "6px",
  color: "#43575d",
  whiteSpace: "pre-wrap",
  lineHeight: 1.6,
};

const actionRowStyle: React.CSSProperties = {
  marginTop: "22px",
  paddingTop: "20px",
  borderTop: "1px solid #e4e9e7",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
};

const closeButtonStyle: React.CSSProperties = {
  border: "1px solid #e1c4c0",
  background: "#ffffff",
  color: "#a23c35",
  borderRadius: "7px",
  padding: "10px 18px",
  fontWeight: 700,
  cursor: "pointer",
};

const openButtonStyle: React.CSSProperties = {
  border: "none",
  background: "#173f4c",
  color: "#ffffff",
  borderRadius: "7px",
  padding: "10px 18px",
  fontWeight: 700,
  cursor: "pointer",
};

const errorStyle: React.CSSProperties = {
  marginBottom: "18px",
  padding: "12px 15px",
  background: "#fff3f1",
  border: "1px solid #f2d4d0",
  borderRadius: "9px",
  color: "#a23c35",
};

const successStyle: React.CSSProperties = {
  marginBottom: "18px",
  padding: "12px 15px",
  background: "#eef8f3",
  border: "1px solid #d3ebdf",
  borderRadius: "9px",
  color: "#286647",
};

const emptyStyle: React.CSSProperties = {
  padding: "50px",
  background: "#ffffff",
  border: "1px solid #dfe6e4",
  borderRadius: "14px",
  textAlign: "center",
  color: "#718086",
};