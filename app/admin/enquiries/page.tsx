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
  quotation_pdf: string | null;
  admin_status: string;
  submitted_at: string;
  updated_at: string | null;
  vendor_company: string;
  vendor_contact: string;
  vendor_email: string;
  vendor_phone: string | null;
};

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
  quotations: VendorQuote[];
};

type Filter = "all" | "open" | "closed";

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const [openQuote, setOpenQuote] = useState<number | null>(null);

  const [updatingEnquiryId, setUpdatingEnquiryId] =
    useState<number | null>(null);

  const [updatingQuoteId, setUpdatingQuoteId] =
    useState<number | null>(null);

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

  async function updateEnquiryStatus(
    enquiryId: number,
    status: "open" | "closed"
  ) {
    setUpdatingEnquiryId(enquiryId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/enquiries/${enquiryId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

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

      setMessage(
        data.message || "Enquiry updated successfully."
      );
    } catch {
      setError("Unable to update enquiry.");
    } finally {
      setUpdatingEnquiryId(null);
    }
  }

  async function updateQuoteStatus(
    enquiryId: number,
    quoteId: number,
    status: "accepted" | "rejected"
  ) {
    setUpdatingQuoteId(quoteId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/vendor-quotes/${quoteId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (!response.ok) {
        setError(data.error || "Unable to update quotation.");
        return;
      }

      setEnquiries((current) =>
        current.map((enquiry) => {
          if (enquiry.id !== enquiryId) return enquiry;

          return {
            ...enquiry,
            quotations: enquiry.quotations.map((quote) =>
              quote.id === quoteId
                ? { ...quote, admin_status: status }
                : quote
            ),
          };
        })
      );

      setMessage(
        data.message || "Quotation updated successfully."
      );
    } catch {
      setError("Unable to update quotation.");
    } finally {
      setUpdatingQuoteId(null);
    }
  }

  const visibleEnquiries = useMemo(() => {
    if (filter === "all") return enquiries;

    if (filter === "closed") {
      return enquiries.filter(
        (enquiry) =>
          enquiry.status?.toLowerCase() === "closed"
      );
    }

    return enquiries.filter(
      (enquiry) =>
        enquiry.status?.toLowerCase() !== "closed"
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
            Review customer requirements and compare vendor quotations.
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
            const isClosed =
              enquiry.status?.toLowerCase() === "closed";

            const quotations = enquiry.quotations || [];

            return (
              <section
                key={enquiry.id}
                style={{
                  ...enquiryCardStyle,
                  ...(isClosed ? closedCardStyle : {}),
                }}
              >
                {/* ENQUIRY HEADER */}

                <div style={enquiryHeaderStyle}>
                  <div style={enquiryTitleRowStyle}>
                    <div style={enquiryTitleLeftStyle}>
                      <span style={enquiryIdStyle}>
                        ENQUIRY #{enquiry.id}
                      </span>

                      <EnquiryStatusBadge status={enquiry.status} />
                    </div>

                    <span style={dateStyle}>
                      {formatDate(enquiry.created_at)}
                    </span>
                  </div>

                  <div style={enquiryMainGridStyle}>
                    <EnquiryMetric
                      label="Product"
                      value={enquiry.product_name || "—"}
                      strong
                    />

                    <EnquiryMetric
                      label="Part Number"
                      value={enquiry.part_number || "—"}
                      strong
                    />

                    <EnquiryMetric
                      label="Quantity"
                      value={enquiry.quantity || "—"}
                    />

                    <EnquiryMetric
                      label="Customer"
                      value={
                        enquiry.company_name ||
                        enquiry.customer_name ||
                        "—"
                      }
                    />

                    <EnquiryMetric
                      label="Matched Vendors"
                      value={Number(enquiry.matched_vendors || 0)}
                    />

                    <EnquiryMetric
                      label="Quotes"
                      value={quotations.length}
                      strong={quotations.length > 0}
                    />
                  </div>

                  <div style={customerStripStyle}>
                    <div style={customerInfoStyle}>
                      <span>
                        <strong>{enquiry.customer_name || "—"}</strong>
                      </span>

                      <span>{enquiry.customer_email || "—"}</span>

                      {enquiry.customer_phone && (
                        <span>{enquiry.customer_phone}</span>
                      )}

                      {enquiry.message && (
                        <span style={customerMessageStyle}>
                          {enquiry.message}
                        </span>
                      )}
                    </div>

                    {isClosed ? (
                      <button
                        type="button"
                        disabled={updatingEnquiryId === enquiry.id}
                        onClick={() =>
                          updateEnquiryStatus(enquiry.id, "open")
                        }
                        style={{
                          ...reopenButtonStyle,
                          opacity:
                            updatingEnquiryId === enquiry.id ? 0.5 : 1,
                        }}
                      >
                        {updatingEnquiryId === enquiry.id
                          ? "Updating..."
                          : "Reopen Enquiry"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={updatingEnquiryId === enquiry.id}
                        onClick={() =>
                          updateEnquiryStatus(enquiry.id, "closed")
                        }
                        style={{
                          ...closeButtonStyle,
                          opacity:
                            updatingEnquiryId === enquiry.id ? 0.5 : 1,
                        }}
                      >
                        {updatingEnquiryId === enquiry.id
                          ? "Updating..."
                          : "Close Enquiry"}
                      </button>
                    )}
                  </div>
                </div>

                {/* QUOTATION SECTION */}

                <div style={quotationSectionStyle}>
                  <div style={quotationHeaderStyle}>
                    <div>
                      <span style={quotationTitleStyle}>
                        Vendor Quotations
                      </span>

                      <span style={quotationCountTextStyle}>
                        {quotations.length} received
                      </span>
                    </div>

                    {quotations.length > 0 && (
                      <span style={instructionStyle}>
                        Click a quotation to view full details
                      </span>
                    )}
                  </div>

                  {quotations.length === 0 ? (
                    <div style={noQuotesStyle}>
                      No vendor quotations received yet.
                    </div>
                  ) : (
                    <>
                      <div style={quoteTableHeaderStyle}>
                        <span></span>
                        <span>Vendor</span>
                        <span>Unit Price</span>
                        <span>Total Price</span>
                        <span>Stock</span>
                        <span>Lead Time</span>
                        <span>Status</span>
                      </div>

                      <div style={quotationListStyle}>
                        {quotations.map((quote) => {
                          const quoteExpanded =
                            openQuote === quote.id;

                          return (
                            <div
                              key={quote.id}
                              style={{
                                ...quoteCardStyle,
                                ...(quoteExpanded
                                  ? activeQuoteCardStyle
                                  : {}),
                              }}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenQuote(
                                    quoteExpanded ? null : quote.id
                                  )
                                }
                                style={quoteRowStyle}
                              >
                                <span style={arrowStyle}>
                                  {quoteExpanded ? "▼" : "▶"}
                                </span>

                                <strong style={vendorNameStyle}>
                                  {quote.vendor_company || "Vendor"}
                                </strong>

                                <strong style={priceStyle}>
                                  {formatMoney(
                                    quote.currency,
                                    quote.unit_price
                                  )}
                                </strong>

                                <strong style={priceStyle}>
                                  {formatMoney(
                                    quote.currency,
                                    quote.total_price
                                  )}
                                </strong>

                                <StockBadge
                                  available={quote.stock_available}
                                />

                                <span style={leadTimeStyle}>
                                  {quote.lead_time || "—"}
                                </span>

                                <QuoteStatusBadge
                                  status={quote.admin_status}
                                />
                              </button>

                              {quoteExpanded && (
                                <div style={quoteExpandedStyle}>
                                  {/* IMPORTANT QUOTE METRICS */}

                                  <div style={highlightGridStyle}>
                                    <HighlightMetric
                                      label="Unit Price"
                                      value={formatMoney(
                                        quote.currency,
                                        quote.unit_price
                                      )}
                                    />

                                    <HighlightMetric
                                      label="Total Price"
                                      value={formatMoney(
                                        quote.currency,
                                        quote.total_price
                                      )}
                                    />

                                    <HighlightMetric
                                      label="Stock"
                                      value={
                                        quote.stock_available === 1
                                          ? "Available"
                                          : "Not Available"
                                      }
                                    />

                                    <HighlightMetric
                                      label="Lead Time"
                                      value={quote.lead_time || "—"}
                                    />
                                  </div>

                                  {/* DETAILS */}

                                  <div style={detailsGridStyle}>
                                    <DetailSection title="Vendor">
                                      <Detail
                                        label="Company"
                                        value={quote.vendor_company || "—"}
                                      />

                                      <Detail
                                        label="Contact Person"
                                        value={quote.vendor_contact || "—"}
                                      />

                                      <Detail
                                        label="Email"
                                        value={quote.vendor_email || "—"}
                                      />

                                      <Detail
                                        label="Phone"
                                        value={quote.vendor_phone || "—"}
                                      />
                                    </DetailSection>

                                    <DetailSection title="Product & Supply">
                                      <Detail
                                        label="Manufacturer / Brand"
                                        value={
                                          quote.manufacturer_brand || "—"
                                        }
                                      />

                                      <Detail
                                        label="Condition"
                                        value={quote.condition || "—"}
                                      />

                                      <Detail
                                        label="Country of Origin"
                                        value={
                                          quote.country_of_origin || "—"
                                        }
                                      />

                                      <Detail
                                        label="Quoted Quantity"
                                        value={
                                          quote.quoted_quantity ?? "—"
                                        }
                                      />
                                    </DetailSection>

                                    <DetailSection title="Commercial Terms">
                                      <Detail
                                        label="MOQ"
                                        value={quote.moq ?? "—"}
                                      />

                                      <Detail
                                        label="Quote Validity"
                                        value={quote.quote_validity || "—"}
                                      />

                                      <Detail
                                        label="Shipping Included"
                                        value={formatYesNo(
                                          quote.shipping_included
                                        )}
                                      />

                                      <Detail
                                        label="Taxes Included"
                                        value={formatYesNo(
                                          quote.taxes_included
                                        )}
                                      />
                                    </DetailSection>
                                  </div>

                                  {quote.vendor_remarks && (
                                    <div style={remarksStyle}>
                                      <span style={labelStyle}>
                                        Vendor Remarks
                                      </span>

                                      <div style={remarksTextStyle}>
                                        {quote.vendor_remarks}
                                      </div>
                                    </div>
                                  )}

                                  <div style={quoteFooterStyle}>
                                    <div style={footerLeftStyle}>
                                      <div>
                                        <span style={labelStyle}>
                                          Submitted
                                        </span>

                                        <span style={detailValueStyle}>
                                          {formatDate(quote.submitted_at)}
                                        </span>
                                      </div>

                                      {quote.quotation_pdf && (
                                        <a
                                          href={quote.quotation_pdf}
                                          target="_blank"
                                          rel="noreferrer"
                                          style={pdfButtonStyle}
                                        >
                                          View Quotation PDF
                                        </a>
                                      )}
                                    </div>

                                    <div style={decisionStyle}>
                                      <QuoteStatusBadge
                                        status={quote.admin_status}
                                      />

                                      <button
                                        type="button"
                                        disabled={
                                          updatingQuoteId === quote.id ||
                                          quote.admin_status === "rejected"
                                        }
                                        onClick={() =>
                                          updateQuoteStatus(
                                            enquiry.id,
                                            quote.id,
                                            "rejected"
                                          )
                                        }
                                        style={{
                                          ...rejectButtonStyle,
                                          opacity:
                                            updatingQuoteId === quote.id ||
                                            quote.admin_status ===
                                              "rejected"
                                              ? 0.45
                                              : 1,
                                        }}
                                      >
                                        Reject
                                      </button>

                                      <button
                                        type="button"
                                        disabled={
                                          updatingQuoteId === quote.id ||
                                          quote.admin_status === "accepted"
                                        }
                                        onClick={() =>
                                          updateQuoteStatus(
                                            enquiry.id,
                                            quote.id,
                                            "accepted"
                                          )
                                        }
                                        style={{
                                          ...acceptButtonStyle,
                                          opacity:
                                            updatingQuoteId === quote.id ||
                                            quote.admin_status ===
                                              "accepted"
                                              ? 0.45
                                              : 1,
                                        }}
                                      >
                                        {updatingQuoteId === quote.id
                                          ? "Updating..."
                                          : "Accept Quote"}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}

function EnquiryMetric({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div style={enquiryMetricStyle}>
      <span style={labelStyle}>{label}</span>

      <span
        style={{
          ...enquiryMetricValueStyle,
          ...(strong ? enquiryMetricStrongStyle : {}),
        }}
      >
        {value}
      </span>
    </div>
  );
}

function HighlightMetric({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div style={highlightMetricStyle}>
      <span style={highlightLabelStyle}>{label}</span>
      <strong style={highlightValueStyle}>{value}</strong>
    </div>
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
      <h3 style={detailSectionTitleStyle}>{title}</h3>
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
    <div style={detailRowStyle}>
      <span style={labelStyle}>{label}</span>
      <span style={detailValueStyle}>{value}</span>
    </div>
  );
}

function EnquiryStatusBadge({
  status,
}: {
  status: string;
}) {
  const closed =
    status?.toLowerCase() === "closed";

  return (
    <span
      style={{
        ...statusBadgeBaseStyle,
        background: closed ? "#fff0ee" : "#eaf6ef",
        color: closed ? "#a23c35" : "#286647",
      }}
    >
      {closed ? "Closed" : "Open"}
    </span>
  );
}

function QuoteStatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    status?.toLowerCase() || "pending";

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
        ...statusBadgeBaseStyle,
        background,
        color,
        textTransform: "capitalize",
      }}
    >
      {normalized}
    </span>
  );
}

function StockBadge({
  available,
}: {
  available: number | null;
}) {
  const inStock = available === 1;

  return (
    <span
      style={{
        fontSize: "12px",
        fontWeight: 700,
        color: inStock ? "#286647" : "#a23c35",
      }}
    >
      {inStock ? "Available" : "Not Available"}
    </span>
  );
}

function formatMoney(
  currency: string | null,
  amount: number | null
) {
  if (amount === null || amount === undefined) return "—";

  return `${currency || ""} ${amount}`.trim();
}

function formatYesNo(value: string | null) {
  if (!value) return "—";

  const normalized = value.toLowerCase();

  if (
    normalized === "yes" ||
    normalized === "true" ||
    normalized === "1"
  ) {
    return "Yes";
  }

  return "No";
}

function formatDate(value: string) {
  if (!value) return "—";

  return new Date(value).toLocaleString();
}

/* =========================
   PAGE
========================= */

const pageStyle: React.CSSProperties = {
  maxWidth: "1380px",
  margin: "0 auto",
  padding: "36px 24px 70px",
};

const pageHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  marginBottom: "22px",
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 5px",
  color: "#173f4c",
  fontSize: "30px",
};

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#718187",
  fontSize: "14px",
};

const countStyle: React.CSSProperties = {
  padding: "8px 13px",
  border: "1px solid #dfe6e4",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#173f4c",
  fontSize: "12px",
  fontWeight: 800,
};

/* =========================
   FILTERS
========================= */

const filtersStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  marginBottom: "18px",
};

const filterButtonStyle: React.CSSProperties = {
  border: "1px solid #d9e1df",
  background: "#ffffff",
  color: "#617278",
  borderRadius: "7px",
  padding: "8px 15px",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
};

const activeFilterStyle: React.CSSProperties = {
  background: "#173f4c",
  borderColor: "#173f4c",
  color: "#ffffff",
};

/* =========================
   ENQUIRY
========================= */

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: "20px",
};

const enquiryCardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #dbe3e1",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 2px 8px rgba(23,63,76,0.04)",
};

const closedCardStyle: React.CSSProperties = {
  opacity: 0.76,
};

const enquiryHeaderStyle: React.CSSProperties = {
  padding: "18px 22px 16px",
};

const enquiryTitleRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "20px",
  marginBottom: "16px",
};

const enquiryTitleLeftStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const enquiryIdStyle: React.CSSProperties = {
  color: "#173f4c",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.04em",
};

const dateStyle: React.CSSProperties = {
  color: "#8a989c",
  fontSize: "11px",
};

const enquiryMainGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "minmax(150px,1.4fr) minmax(120px,1fr) 80px minmax(150px,1.3fr) 100px 70px",
  gap: "22px",
  alignItems: "start",
};

const enquiryMetricStyle: React.CSSProperties = {
  minWidth: 0,
};

const enquiryMetricValueStyle: React.CSSProperties = {
  display: "block",
  color: "#465b61",
  fontSize: "13px",
  overflowWrap: "anywhere",
};

const enquiryMetricStrongStyle: React.CSSProperties = {
  color: "#173f4c",
  fontWeight: 800,
  fontSize: "14px",
};

const customerStripStyle: React.CSSProperties = {
  marginTop: "16px",
  paddingTop: "13px",
  borderTop: "1px solid #edf1f0",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
};

const customerInfoStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  flexWrap: "wrap",
  color: "#6a7a80",
  fontSize: "11px",
};

const customerMessageStyle: React.CSSProperties = {
  color: "#849196",
  fontStyle: "italic",
};

/* =========================
   QUOTATION LIST
========================= */

const quotationSectionStyle: React.CSSProperties = {
  background: "#f8faf9",
  borderTop: "1px solid #e2e9e7",
  padding: "16px 22px 20px",
};

const quotationHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  marginBottom: "12px",
};

const quotationTitleStyle: React.CSSProperties = {
  color: "#173f4c",
  fontSize: "12px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const quotationCountTextStyle: React.CSSProperties = {
  marginLeft: "10px",
  color: "#2a8392",
  fontSize: "11px",
  fontWeight: 700,
};

const instructionStyle: React.CSSProperties = {
  color: "#8a979b",
  fontSize: "10px",
};

const quoteTableHeaderStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "24px minmax(150px,1.4fr) 120px 120px 110px 110px 100px",
  gap: "16px",
  padding: "0 15px 7px",
  color: "#8a979b",
  fontSize: "9px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const quotationListStyle: React.CSSProperties = {
  display: "grid",
  gap: "7px",
};

const quoteCardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #dfe6e4",
  borderRadius: "8px",
  overflow: "hidden",
};

const activeQuoteCardStyle: React.CSSProperties = {
  borderColor: "#b8d1d4",
  boxShadow: "0 3px 10px rgba(23,63,76,0.05)",
};

const quoteRowStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  background: "#ffffff",
  display: "grid",
  gridTemplateColumns:
    "24px minmax(150px,1.4fr) 120px 120px 110px 110px 100px",
  gap: "16px",
  alignItems: "center",
  padding: "13px 15px",
  textAlign: "left",
  cursor: "pointer",
};

const arrowStyle: React.CSSProperties = {
  color: "#2a8392",
  fontSize: "10px",
};

const vendorNameStyle: React.CSSProperties = {
  color: "#173f4c",
  fontSize: "13px",
};

const priceStyle: React.CSSProperties = {
  color: "#173f4c",
  fontSize: "13px",
};

const leadTimeStyle: React.CSSProperties = {
  color: "#52656b",
  fontSize: "12px",
};

/* =========================
   EXPANDED QUOTE
========================= */

const quoteExpandedStyle: React.CSSProperties = {
  borderTop: "1px solid #e5ebe9",
  background: "#ffffff",
  padding: "20px",
};

const highlightGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "10px",
  marginBottom: "24px",
};

const highlightMetricStyle: React.CSSProperties = {
  padding: "14px 16px",
  border: "1px solid #e1e8e6",
  borderRadius: "8px",
  background: "#f9fbfa",
};

const highlightLabelStyle: React.CSSProperties = {
  display: "block",
  color: "#8a979b",
  fontSize: "9px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "5px",
};

const highlightValueStyle: React.CSSProperties = {
  display: "block",
  color: "#173f4c",
  fontSize: "17px",
};

const detailsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: "50px",
};

const detailSectionTitleStyle: React.CSSProperties = {
  margin: "0 0 15px",
  paddingBottom: "8px",
  borderBottom: "1px solid #edf1f0",
  color: "#173f4c",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const detailRowStyle: React.CSSProperties = {
  marginBottom: "12px",
};

const detailValueStyle: React.CSSProperties = {
  color: "#465b61",
  fontSize: "12px",
  overflowWrap: "anywhere",
};

const remarksStyle: React.CSSProperties = {
  marginTop: "20px",
  padding: "14px 16px",
  background: "#f9fbfa",
  border: "1px solid #e2e9e7",
  borderRadius: "8px",
};

const remarksTextStyle: React.CSSProperties = {
  color: "#465b61",
  fontSize: "12px",
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
};

const quoteFooterStyle: React.CSSProperties = {
  marginTop: "20px",
  paddingTop: "18px",
  borderTop: "1px solid #e5ebe9",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
};

const footerLeftStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "24px",
};

const decisionStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "9px",
};

/* =========================
   COMMON
========================= */

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "#8a979b",
  fontSize: "9px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.045em",
  marginBottom: "4px",
};

const statusBadgeBaseStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "5px 9px",
  borderRadius: "999px",
  fontSize: "10px",
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const closeButtonStyle: React.CSSProperties = {
  border: "1px solid #e1c4c0",
  background: "#ffffff",
  color: "#a23c35",
  borderRadius: "7px",
  padding: "8px 13px",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
};

const reopenButtonStyle: React.CSSProperties = {
  border: "none",
  background: "#173f4c",
  color: "#ffffff",
  borderRadius: "7px",
  padding: "8px 13px",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
};

const acceptButtonStyle: React.CSSProperties = {
  border: "none",
  background: "#173f4c",
  color: "#ffffff",
  borderRadius: "7px",
  padding: "9px 16px",
  fontSize: "11px",
  fontWeight: 800,
  cursor: "pointer",
};

const rejectButtonStyle: React.CSSProperties = {
  border: "1px solid #e0c8c4",
  background: "#ffffff",
  color: "#a23c35",
  borderRadius: "7px",
  padding: "9px 16px",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
};

const pdfButtonStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "8px 12px",
  border: "1px solid #c9d9da",
  borderRadius: "7px",
  color: "#2a8392",
  background: "#ffffff",
  fontSize: "11px",
  fontWeight: 800,
  textDecoration: "none",
};

const noQuotesStyle: React.CSSProperties = {
  padding: "18px",
  border: "1px dashed #d6dfdd",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#879499",
  textAlign: "center",
  fontSize: "12px",
};

const errorStyle: React.CSSProperties = {
  marginBottom: "18px",
  padding: "12px 15px",
  background: "#fff3f1",
  border: "1px solid #f2d4d0",
  borderRadius: "8px",
  color: "#a23c35",
};

const successStyle: React.CSSProperties = {
  marginBottom: "18px",
  padding: "12px 15px",
  background: "#eef8f3",
  border: "1px solid #d3ebdf",
  borderRadius: "8px",
  color: "#286647",
};

const emptyStyle: React.CSSProperties = {
  padding: "45px",
  background: "#ffffff",
  border: "1px solid #dfe6e4",
  borderRadius: "10px",
  textAlign: "center",
  color: "#718086",
};