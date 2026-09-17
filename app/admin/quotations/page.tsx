"use client";

import { useEffect, useMemo, useState } from "react";

type VendorQuote = {
  id: number;
  enquiry_id: number;
  vendor_id: number;
  quoted_quantity: number | null;
  unit_price: number | null;
  currency: string | null;
  total_price: number | null;
  stock_available: number | null;
  lead_time: string | null;
  moq: number | null;
  condition: string | null;
  manufacturer_brand: string | null;
  country_of_origin: string | null;
  quote_validity: string | null;
  shipping_included: string | null;
  taxes_included: string | null;
  vendor_remarks: string | null;
  admin_status: string;
  submitted_at: string;

  vendor_company: string;
  vendor_contact: string;
  vendor_email: string;
  vendor_phone: string | null;

  product_name: string | null;
  part_number: string | null;
  requested_quantity: string | null;

  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_company: string | null;
};

type Filter = "all" | "pending" | "accepted" | "rejected";

export default function AdminQuotationsPage() {
  const [quotes, setQuotes] = useState<VendorQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [openQuote, setOpenQuote] = useState<number | null>(null);

  useEffect(() => {
    loadQuotes();
  }, []);

  async function loadQuotes() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/vendor-quotes", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to load quotations.");
        return;
      }

      setQuotes(data.quotes || []);
    } catch {
      setError("Unable to load quotations.");
    } finally {
      setLoading(false);
    }
  }

  const visibleQuotes = useMemo(() => {
    if (filter === "all") return quotes;

    return quotes.filter(
      (quote) => quote.admin_status?.toLowerCase() === filter
    );
  }, [quotes, filter]);

  if (loading) {
    return <main style={pageStyle}>Loading quotations...</main>;
  }

  return (
    <main style={pageStyle}>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={titleStyle}>Quotations</h1>
          <p style={subtitleStyle}>
            Review quotations received from vendors.
          </p>
        </div>

        <div style={countStyle}>
          {quotes.length} {quotes.length === 1 ? "Quotation" : "Quotations"}
        </div>
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      <div style={filtersStyle}>
        {(["all", "pending", "accepted", "rejected"] as Filter[]).map(
          (item) => (
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
          )
        )}
      </div>

      {visibleQuotes.length === 0 ? (
        <div style={emptyStyle}>No quotations found.</div>
      ) : (
        <div style={listStyle}>
          {visibleQuotes.map((quote) => {
            const expanded = openQuote === quote.id;

            return (
              <section key={quote.id} style={cardStyle}>
                <div style={summaryStyle}>
                  <div style={quoteNumberStyle}>#{quote.id}</div>

                  <div style={mainInfoStyle}>
                    <strong style={productStyle}>
                      {quote.product_name || "Product"}
                    </strong>

                    <span style={smallStyle}>
                      {quote.part_number
                        ? `Part No. ${quote.part_number}`
                        : "No part number"}
                    </span>
                  </div>

                  <div style={summaryBlockStyle}>
                    <span style={labelStyle}>Vendor</span>
                    <strong>{quote.vendor_company}</strong>
                  </div>

                  <div style={summaryBlockStyle}>
                    <span style={labelStyle}>Total</span>
                    <strong style={{ color: "#173f4c" }}>
                      {quote.currency || ""}{" "}
                      {quote.total_price ?? "—"}
                    </strong>
                  </div>

                  <div style={summaryBlockStyle}>
                    <span style={labelStyle}>Quantity</span>
                    <strong>{quote.quoted_quantity ?? "—"}</strong>
                  </div>

                  <StatusBadge status={quote.admin_status} />

                  <button
                    type="button"
                    onClick={() =>
                      setOpenQuote(expanded ? null : quote.id)
                    }
                    style={viewButtonStyle}
                  >
                    {expanded ? "Close" : "View Details"}
                  </button>
                </div>

                {expanded && (
                  <div style={expandedStyle}>
                    <div style={detailGridStyle}>
                      <DetailSection title="Customer Enquiry">
                        <Detail label="Customer" value={quote.customer_name} />
                        <Detail
                          label="Company"
                          value={quote.customer_company || "—"}
                        />
                        <Detail label="Email" value={quote.customer_email} />
                        <Detail
                          label="Phone"
                          value={quote.customer_phone || "—"}
                        />
                        <Detail
                          label="Required Quantity"
                          value={quote.requested_quantity || "—"}
                        />
                      </DetailSection>

                      <DetailSection title="Vendor">
                        <Detail
                          label="Company"
                          value={quote.vendor_company}
                        />
                        <Detail
                          label="Contact"
                          value={quote.vendor_contact}
                        />
                        <Detail label="Email" value={quote.vendor_email} />
                        <Detail
                          label="Phone"
                          value={quote.vendor_phone || "—"}
                        />
                      </DetailSection>

                      <DetailSection title="Quotation">
                        <Detail
                          label="Quoted Quantity"
                          value={quote.quoted_quantity ?? "—"}
                        />
                        <Detail
                          label="Unit Price"
                          value={`${quote.currency || ""} ${
                            quote.unit_price ?? "—"
                          }`}
                        />
                        <Detail
                          label="Total Price"
                          value={`${quote.currency || ""} ${
                            quote.total_price ?? "—"
                          }`}
                        />
                        <Detail
                          label="Stock Available"
                          value={quote.stock_available === 1 ? "Yes" : "No"}
                        />
                        <Detail
                          label="Lead Time"
                          value={quote.lead_time || "—"}
                        />
                        <Detail label="MOQ" value={quote.moq ?? "—"} />
                        <Detail
                          label="Condition"
                          value={quote.condition || "—"}
                        />
                        <Detail
                          label="Manufacturer / Brand"
                          value={quote.manufacturer_brand || "—"}
                        />
                        <Detail
                          label="Country of Origin"
                          value={quote.country_of_origin || "—"}
                        />
                        <Detail
                          label="Quote Validity"
                          value={quote.quote_validity || "—"}
                        />
                        <Detail
                          label="Shipping Included"
                          value={formatYesNo(quote.shipping_included)}
                        />
                        <Detail
                          label="Taxes Included"
                          value={formatYesNo(quote.taxes_included)}
                        />
                      </DetailSection>
                    </div>

                    {quote.vendor_remarks && (
                      <div style={remarksStyle}>
                        <span style={labelStyle}>Vendor Remarks</span>
                        <div style={{ marginTop: "6px", color: "#43575d" }}>
                          {quote.vendor_remarks}
                        </div>
                      </div>
                    )}

                    <div style={submittedStyle}>
                      Submitted: {formatDate(quote.submitted_at)}
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
  const normalized = status?.toLowerCase();

  let background = "#fff7df";
  let color = "#886818";

  if (normalized === "accepted") {
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
        whiteSpace: "nowrap",
      }}
    >
      {status || "pending"}
    </span>
  );
}

function formatYesNo(value: string | null) {
  if (!value) return "—";
  return value.toLowerCase() === "yes" ? "Yes" : "No";
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
    "50px minmax(180px, 1.5fr) minmax(130px, 1fr) 120px 80px auto auto",
  alignItems: "center",
  gap: "18px",
};

const quoteNumberStyle: React.CSSProperties = {
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
  gap: "35px",
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

const remarksStyle: React.CSSProperties = {
  marginTop: "20px",
  padding: "15px",
  background: "#ffffff",
  border: "1px solid #e4e9e7",
  borderRadius: "8px",
};

const submittedStyle: React.CSSProperties = {
  marginTop: "18px",
  color: "#879398",
  fontSize: "12px",
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