"use client";

import { useEffect, useState } from "react";

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

export default function AdminQuotationsPage() {
  const [quotes, setQuotes] = useState<VendorQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) {
    return (
      <main
        style={{
          maxWidth: "1450px",
          margin: "0 auto",
          padding: "50px 24px",
        }}
      >
        <p>Loading quotations...</p>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: "1450px",
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
          Quotations
        </h1>

        <p
          style={{
            margin: 0,
            color: "#67797f",
          }}
        >
          Review quotations submitted by vendors for customer enquiries.
        </p>
      </div>

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

      {quotes.length === 0 ? (
        <div
          style={{
            padding: "40px",
            background: "#ffffff",
            border: "1px solid #e1e6e4",
            borderRadius: "16px",
            textAlign: "center",
            color: "#718086",
          }}
        >
          No vendor quotations submitted yet.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "20px",
          }}
        >
          {quotes.map((quote) => (
            <div
              key={quote.id}
              style={{
                background: "#ffffff",
                border: "1px solid #e1e6e4",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "20px",
                  flexWrap: "wrap",
                  marginBottom: "24px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#2a8392",
                      marginBottom: "6px",
                    }}
                  >
                    QUOTATION #{quote.id}
                  </div>

                  <h2
                    style={{
                      margin: 0,
                      color: "#173f4c",
                      fontSize: "21px",
                    }}
                  >
                    {quote.product_name || "Product"}
                  </h2>

                  <div
                    style={{
                      marginTop: "5px",
                      color: "#67797f",
                      fontSize: "14px",
                    }}
                  >
                    Part Number: {quote.part_number || "—"}
                  </div>
                </div>

                <div
                  style={{
                    padding: "8px 14px",
                    borderRadius: "20px",
                    background: "#f7f5ef",
                    color: "#173f4c",
                    fontWeight: 700,
                    fontSize: "13px",
                    height: "fit-content",
                  }}
                >
                  {formatStatus(quote.admin_status)}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "24px",
                }}
              >
                <Section title="Customer Enquiry">
                  <Row
                    label="Customer"
                    value={quote.customer_name || "—"}
                  />
                  <Row
                    label="Company"
                    value={quote.customer_company || "—"}
                  />
                  <Row
                    label="Email"
                    value={quote.customer_email || "—"}
                  />
                  <Row
                    label="Phone"
                    value={quote.customer_phone || "—"}
                  />
                  <Row
                    label="Required Quantity"
                    value={quote.requested_quantity || "—"}
                  />
                </Section>

                <Section title="Vendor">
                  <Row
                    label="Company"
                    value={quote.vendor_company || "—"}
                  />
                  <Row
                    label="Contact"
                    value={quote.vendor_contact || "—"}
                  />
                  <Row
                    label="Email"
                    value={quote.vendor_email || "—"}
                  />
                  <Row
                    label="Phone"
                    value={quote.vendor_phone || "—"}
                  />
                </Section>

                <Section title="Quotation">
                  <Row
                    label="Quoted Quantity"
                    value={quote.quoted_quantity ?? "—"}
                  />

                  <Row
                    label="Unit Price"
                    value={
                      quote.unit_price !== null
                        ? `${quote.currency || ""} ${quote.unit_price}`
                        : "—"
                    }
                  />

                  <Row
                    label="Total Price"
                    value={
                      quote.total_price !== null
                        ? `${quote.currency || ""} ${quote.total_price}`
                        : "—"
                    }
                  />

                  <Row
                    label="Stock Available"
                    value={
                      quote.stock_available === 1 ? "Yes" : "No"
                    }
                  />

                  <Row
                    label="Lead Time"
                    value={quote.lead_time || "—"}
                  />

                  <Row
                    label="MOQ"
                    value={quote.moq ?? "—"}
                  />

                  <Row
                    label="Condition"
                    value={quote.condition || "—"}
                  />

                  <Row
                    label="Manufacturer / Brand"
                    value={quote.manufacturer_brand || "—"}
                  />

                  <Row
                    label="Country of Origin"
                    value={quote.country_of_origin || "—"}
                  />

                  <Row
                    label="Quote Validity"
                    value={quote.quote_validity || "—"}
                  />

                  <Row
                    label="Shipping Included"
                    value={formatYesNo(quote.shipping_included)}
                  />

                  <Row
                    label="Taxes Included"
                    value={formatYesNo(quote.taxes_included)}
                  />
                </Section>
              </div>

              {quote.vendor_remarks && (
                <div
                  style={{
                    marginTop: "24px",
                    padding: "16px",
                    background: "#f7f5ef",
                    borderRadius: "10px",
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      color: "#173f4c",
                      marginBottom: "6px",
                    }}
                  >
                    Vendor Remarks
                  </strong>

                  <span
                    style={{
                      color: "#4d6066",
                      lineHeight: 1.6,
                    }}
                  >
                    {quote.vendor_remarks}
                  </span>
                </div>
              )}

              <div
                style={{
                  marginTop: "20px",
                  paddingTop: "16px",
                  borderTop: "1px solid #edf0ef",
                  color: "#718086",
                  fontSize: "13px",
                }}
              >
                Submitted: {formatDate(quote.submitted_at)}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3
        style={{
          margin: "0 0 14px",
          color: "#173f4c",
          fontSize: "16px",
        }}
      >
        {title}
      </h3>

      <div
        style={{
          display: "grid",
          gap: "9px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "15px",
        fontSize: "14px",
      }}
    >
      <span style={{ color: "#718086" }}>{label}</span>

      <strong
        style={{
          color: "#344b52",
          textAlign: "right",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function formatStatus(status: string) {
  if (!status) return "Pending";

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatYesNo(value: string | null) {
  if (!value) return "—";

  return value.toLowerCase() === "yes" ? "Yes" : "No";
}

function formatDate(value: string) {
  if (!value) return "—";

  return new Date(value).toLocaleString();
}