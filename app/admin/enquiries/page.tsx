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

  const [openEnquiry, setOpenEnquiry] = useState<number | null>(null);
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
          if (enquiry.id !== enquiryId) {
            return enquiry;
          }

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
    if (filter === "all") {
      return enquiries;
    }

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
    return (
      <main style={pageStyle}>
        Loading enquiries...
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={titleStyle}>Enquiries</h1>

          <p style={subtitleStyle}>
            Customer enquiries and vendor quotations in one place.
          </p>
        </div>

        <div style={countStyle}>
          {enquiries.length}{" "}
          {enquiries.length === 1
            ? "Enquiry"
            : "Enquiries"}
        </div>
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      {message && (
        <div style={successStyle}>{message}</div>
      )}

      <div style={filtersStyle}>
        {(["all", "open", "closed"] as Filter[]).map(
          (item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              style={{
                ...filterButtonStyle,
                ...(filter === item
                  ? activeFilterStyle
                  : {}),
              }}
            >
              {item.charAt(0).toUpperCase() +
                item.slice(1)}
            </button>
          )
        )}
      </div>

      {visibleEnquiries.length === 0 ? (
        <div style={emptyStyle}>
          No enquiries found.
        </div>
      ) : (
        <div style={listStyle}>
          {visibleEnquiries.map((enquiry) => {
            const enquiryExpanded =
              openEnquiry === enquiry.id;

            const isClosed =
              enquiry.status?.toLowerCase() === "closed";

            const quotations =
              enquiry.quotations || [];

            return (
              <section
                key={enquiry.id}
                style={{
                  ...cardStyle,
                  ...(isClosed
                    ? closedCardStyle
                    : {}),
                }}
              >
                {/* CUSTOMER ENQUIRY SUMMARY */}

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
                    <span style={labelStyle}>
                      Customer
                    </span>

                    <strong>
                      {enquiry.company_name ||
                        enquiry.customer_name ||
                        "—"}
                    </strong>
                  </div>

                  <div style={summaryBlockStyle}>
                    <span style={labelStyle}>
                      Quantity
                    </span>

                    <strong>
                      {enquiry.quantity || "—"}
                    </strong>
                  </div>

                  <div style={summaryBlockStyle}>
                    <span style={labelStyle}>
                      Vendors
                    </span>

                    <strong>
                      {Number(
                        enquiry.matched_vendors || 0
                      )}
                    </strong>
                  </div>

                  <div style={summaryBlockStyle}>
                    <span style={labelStyle}>
                      Quotes
                    </span>

                    <strong
                      style={
                        quotations.length > 0
                          ? quoteCountHighlightStyle
                          : undefined
                      }
                    >
                      {quotations.length}
                    </strong>
                  </div>

                  <EnquiryStatusBadge
                    status={enquiry.status}
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setOpenEnquiry(
                        enquiryExpanded
                          ? null
                          : enquiry.id
                      );

                      if (enquiryExpanded) {
                        setOpenQuote(null);
                      }
                    }}
                    style={viewButtonStyle}
                  >
                    {enquiryExpanded
                      ? "Hide Details"
                      : "View Details"}
                  </button>
                </div>

                {/* QUICK QUOTATION PREVIEW */}

                {!enquiryExpanded &&
                  quotations.length > 0 && (
                    <div style={quotePreviewBarStyle}>
                      <span style={quotePreviewLabelStyle}>
                        {quotations.length}{" "}
                        {quotations.length === 1
                          ? "quotation"
                          : "quotations"}{" "}
                        received
                      </span>

                      {quotations
                        .slice(0, 3)
                        .map((quote) => (
                          <span
                            key={quote.id}
                            style={quickQuoteStyle}
                          >
                            {quote.vendor_company}:{" "}
                            <strong>
                              {formatMoney(
                                quote.currency,
                                quote.total_price
                              )}
                            </strong>
                          </span>
                        ))}

                      {quotations.length > 3 && (
                        <span style={moreQuotesStyle}>
                          +{quotations.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                {/* FULL ENQUIRY */}

                {enquiryExpanded && (
                  <div style={expandedStyle}>
                    <div style={enquiryTopRowStyle}>
                      <div>
                        <h3 style={sectionTitleStyle}>
                          Customer Details
                        </h3>

                        <div style={customerGridStyle}>
                          <Detail
                            label="Name"
                            value={
                              enquiry.customer_name || "—"
                            }
                          />

                          <Detail
                            label="Company"
                            value={
                              enquiry.company_name || "—"
                            }
                          />

                          <Detail
                            label="Email"
                            value={
                              enquiry.customer_email || "—"
                            }
                          />

                          <Detail
                            label="Phone"
                            value={
                              enquiry.customer_phone || "—"
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <h3 style={sectionTitleStyle}>
                          Product Details
                        </h3>

                        <div style={customerGridStyle}>
                          <Detail
                            label="Product"
                            value={
                              enquiry.product_name || "—"
                            }
                          />

                          <Detail
                            label="Part Number"
                            value={
                              enquiry.part_number || "—"
                            }
                          />

                          <Detail
                            label="Quantity"
                            value={
                              enquiry.quantity || "—"
                            }
                          />

                          <Detail
                            label="Received"
                            value={formatDate(
                              enquiry.created_at
                            )}
                          />
                        </div>
                      </div>
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

                    {/* ENQUIRY STATUS ACTION */}

                    <div style={enquiryActionRowStyle}>
                      <div style={matchingSummaryStyle}>
                        <div>
                          <span style={labelStyle}>
                            Matched Vendors
                          </span>

                          <strong>
                            {Number(
                              enquiry.matched_vendors || 0
                            )}
                          </strong>
                        </div>

                        <div>
                          <span style={labelStyle}>
                            Quotations
                          </span>

                          <strong>
                            {quotations.length}
                          </strong>
                        </div>

                        <div>
                          <span style={labelStyle}>
                            Status
                          </span>

                          <EnquiryStatusBadge
                            status={enquiry.status}
                          />
                        </div>
                      </div>

                      {isClosed ? (
                        <button
                          type="button"
                          disabled={
                            updatingEnquiryId ===
                            enquiry.id
                          }
                          onClick={() =>
                            updateEnquiryStatus(
                              enquiry.id,
                              "open"
                            )
                          }
                          style={{
                            ...openButtonStyle,
                            opacity:
                              updatingEnquiryId ===
                              enquiry.id
                                ? 0.5
                                : 1,
                          }}
                        >
                          {updatingEnquiryId ===
                          enquiry.id
                            ? "Updating..."
                            : "Reopen Enquiry"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={
                            updatingEnquiryId ===
                            enquiry.id
                          }
                          onClick={() =>
                            updateEnquiryStatus(
                              enquiry.id,
                              "closed"
                            )
                          }
                          style={{
                            ...closeButtonStyle,
                            opacity:
                              updatingEnquiryId ===
                              enquiry.id
                                ? 0.5
                                : 1,
                          }}
                        >
                          {updatingEnquiryId ===
                          enquiry.id
                            ? "Updating..."
                            : "Close Enquiry"}
                        </button>
                      )}
                    </div>

                    {/* QUOTATIONS */}

                    <div style={quotationSectionStyle}>
                      <div style={quotationHeadingRowStyle}>
                        <div>
                          <h2 style={quotationHeadingStyle}>
                            Vendor Quotations
                          </h2>

                          <p style={quotationSubtitleStyle}>
                            Compare prices and open a
                            quotation to review all details.
                          </p>
                        </div>

                        <div style={quotationCountStyle}>
                          {quotations.length} received
                        </div>
                      </div>

                      {quotations.length === 0 ? (
                        <div style={noQuotesStyle}>
                          No quotations received yet.
                        </div>
                      ) : (
                        <div style={quotationListStyle}>
                          {quotations.map((quote) => {
                            const quoteExpanded =
                              openQuote === quote.id;

                            return (
                              <div
                                key={quote.id}
                                style={quotationCardStyle}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenQuote(
                                      quoteExpanded
                                        ? null
                                        : quote.id
                                    )
                                  }
                                  style={quotationSummaryButtonStyle}
                                >
                                  <div
                                    style={quoteArrowStyle}
                                  >
                                    {quoteExpanded
                                      ? "▼"
                                      : "▶"}
                                  </div>

                                  <div
                                    style={quoteVendorStyle}
                                  >
                                    <span
                                      style={labelStyle}
                                    >
                                      Vendor
                                    </span>

                                    <strong>
                                      {quote.vendor_company}
                                    </strong>
                                  </div>

                                  <QuoteMetric
                                    label="Unit Price"
                                    value={formatMoney(
                                      quote.currency,
                                      quote.unit_price
                                    )}
                                    highlight
                                  />

                                  <QuoteMetric
                                    label="Total"
                                    value={formatMoney(
                                      quote.currency,
                                      quote.total_price
                                    )}
                                    highlight
                                  />

                                  <QuoteMetric
                                    label="Stock"
                                    value={
                                      quote.stock_available ===
                                      1
                                        ? "Available"
                                        : "Not Available"
                                    }
                                  />

                                  <QuoteMetric
                                    label="Lead Time"
                                    value={
                                      quote.lead_time ||
                                      "—"
                                    }
                                  />

                                  <QuoteStatusBadge
                                    status={
                                      quote.admin_status
                                    }
                                  />
                                </button>

                                {quoteExpanded && (
                                  <div
                                    style={
                                      quotationExpandedStyle
                                    }
                                  >
                                    <div
                                      style={
                                        quotationDetailGridStyle
                                      }
                                    >
                                      <DetailSection title="Vendor">
                                        <Detail
                                          label="Company"
                                          value={
                                            quote.vendor_company
                                          }
                                        />

                                        <Detail
                                          label="Contact"
                                          value={
                                            quote.vendor_contact ||
                                            "—"
                                          }
                                        />

                                        <Detail
                                          label="Email"
                                          value={
                                            quote.vendor_email ||
                                            "—"
                                          }
                                        />

                                        <Detail
                                          label="Phone"
                                          value={
                                            quote.vendor_phone ||
                                            "—"
                                          }
                                        />
                                      </DetailSection>

                                      <DetailSection title="Price & Availability">
                                        <Detail
                                          label="Quoted Quantity"
                                          value={
                                            quote.quoted_quantity ??
                                            "—"
                                          }
                                        />

                                        <Detail
                                          label="Unit Price"
                                          value={formatMoney(
                                            quote.currency,
                                            quote.unit_price
                                          )}
                                        />

                                        <Detail
                                          label="Total Price"
                                          value={formatMoney(
                                            quote.currency,
                                            quote.total_price
                                          )}
                                        />

                                        <Detail
                                          label="Stock Available"
                                          value={
                                            quote.stock_available ===
                                            1
                                              ? "Yes"
                                              : "No"
                                          }
                                        />

                                        <Detail
                                          label="Lead Time"
                                          value={
                                            quote.lead_time ||
                                            "—"
                                          }
                                        />

                                        <Detail
                                          label="MOQ"
                                          value={
                                            quote.moq ?? "—"
                                          }
                                        />
                                      </DetailSection>

                                      <DetailSection title="Product & Terms">
                                        <Detail
                                          label="Condition"
                                          value={
                                            quote.condition ||
                                            "—"
                                          }
                                        />

                                        <Detail
                                          label="Manufacturer / Brand"
                                          value={
                                            quote.manufacturer_brand ||
                                            "—"
                                          }
                                        />

                                        <Detail
                                          label="Country of Origin"
                                          value={
                                            quote.country_of_origin ||
                                            "—"
                                          }
                                        />

                                        <Detail
                                          label="Quote Validity"
                                          value={
                                            quote.quote_validity ||
                                            "—"
                                          }
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
                                      <div
                                        style={remarksStyle}
                                      >
                                        <span
                                          style={labelStyle}
                                        >
                                          Vendor Remarks
                                        </span>

                                        <div
                                          style={
                                            messageTextStyle
                                          }
                                        >
                                          {
                                            quote.vendor_remarks
                                          }
                                        </div>
                                      </div>
                                    )}

                                    {quote.quotation_pdf && (
                                      <div
                                        style={pdfRowStyle}
                                      >
                                        <span
                                          style={labelStyle}
                                        >
                                          Quotation PDF
                                        </span>

                                        <a
                                          href={
                                            quote.quotation_pdf
                                          }
                                          target="_blank"
                                          rel="noreferrer"
                                          style={pdfLinkStyle}
                                        >
                                          Open Quotation PDF
                                        </a>
                                      </div>
                                    )}

                                    <div
                                      style={quoteActionRowStyle}
                                    >
                                      <div>
                                        <span
                                          style={labelStyle}
                                        >
                                          Submitted
                                        </span>

                                        <span
                                          style={
                                            valueStyle
                                          }
                                        >
                                          {formatDate(
                                            quote.submitted_at
                                          )}
                                        </span>
                                      </div>

                                      <div
                                        style={
                                          quoteDecisionStyle
                                        }
                                      >
                                        <QuoteStatusBadge
                                          status={
                                            quote.admin_status
                                          }
                                        />

                                        <button
                                          type="button"
                                          disabled={
                                            updatingQuoteId ===
                                              quote.id ||
                                            quote.admin_status ===
                                              "accepted"
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
                                              updatingQuoteId ===
                                                quote.id ||
                                              quote.admin_status ===
                                                "accepted"
                                                ? 0.45
                                                : 1,
                                          }}
                                        >
                                          {updatingQuoteId ===
                                          quote.id
                                            ? "Updating..."
                                            : "Accept"}
                                        </button>

                                        <button
                                          type="button"
                                          disabled={
                                            updatingQuoteId ===
                                              quote.id ||
                                            quote.admin_status ===
                                              "rejected"
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
                                              updatingQuoteId ===
                                                quote.id ||
                                              quote.admin_status ===
                                                "rejected"
                                                ? 0.45
                                                : 1,
                                          }}
                                        >
                                          {updatingQuoteId ===
                                          quote.id
                                            ? "Updating..."
                                            : "Reject"}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
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

function QuoteMetric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div style={quoteMetricStyle}>
      <span style={labelStyle}>{label}</span>

      <strong
        style={
          highlight
            ? quoteMetricHighlightStyle
            : quoteMetricValueStyle
        }
      >
        {value}
      </strong>
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
        padding: "7px 12px",
        borderRadius: "999px",
        background: closed
          ? "#fff0ee"
          : "#eaf6ef",
        color: closed
          ? "#a23c35"
          : "#286647",
        fontSize: "12px",
        fontWeight: 700,
        whiteSpace: "nowrap",
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
        padding: "7px 11px",
        borderRadius: "999px",
        background,
        color,
        fontSize: "11px",
        fontWeight: 700,
        textTransform: "capitalize",
        whiteSpace: "nowrap",
      }}
    >
      {normalized}
    </span>
  );
}

function formatMoney(
  currency: string | null,
  amount: number | null
) {
  if (
    amount === null ||
    amount === undefined
  ) {
    return "—";
  }

  return `${currency || ""} ${amount}`.trim();
}

function formatYesNo(
  value: string | null
) {
  if (!value) return "—";

  return value.toLowerCase() === "yes"
    ? "Yes"
    : "No";
}

function formatDate(value: string) {
  if (!value) return "—";

  return new Date(value).toLocaleString();
}

const pageStyle: React.CSSProperties = {
  maxWidth: "1300px",
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
  gap: "14px",
};

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #dfe6e4",
  borderRadius: "12px",
  overflow: "hidden",
};

const closedCardStyle: React.CSSProperties = {
  opacity: 0.78,
};

const summaryStyle: React.CSSProperties = {
  padding: "18px 20px",
  display: "grid",
  gridTemplateColumns:
    "50px minmax(170px, 1.5fr) minmax(130px, 1fr) 70px 70px 65px auto auto",
  alignItems: "center",
  gap: "16px",
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

const quoteCountHighlightStyle: React.CSSProperties = {
  color: "#2a8392",
  fontSize: "15px",
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

const quotePreviewBarStyle: React.CSSProperties = {
  borderTop: "1px solid #edf0ef",
  padding: "10px 20px",
  display: "flex",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
  background: "#fafbf9",
  fontSize: "12px",
};

const quotePreviewLabelStyle: React.CSSProperties = {
  color: "#2a8392",
  fontWeight: 800,
};

const quickQuoteStyle: React.CSSProperties = {
  color: "#52666c",
};

const moreQuotesStyle: React.CSSProperties = {
  color: "#879398",
};

const expandedStyle: React.CSSProperties = {
  borderTop: "1px solid #edf0ef",
  padding: "24px",
  background: "#fbfbf9",
};

const enquiryTopRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "50px",
};

const customerGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "4px 30px",
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

const enquiryActionRowStyle: React.CSSProperties = {
  marginTop: "22px",
  paddingTop: "20px",
  borderTop: "1px solid #e4e9e7",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
};

const matchingSummaryStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "35px",
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

const closeButtonStyle: React.CSSProperties = {
  border: "1px solid #e1c4c0",
  background: "#ffffff",
  color: "#a23c35",
  borderRadius: "7px",
  padding: "10px 18px",
  fontWeight: 700,
  cursor: "pointer",
};

const quotationSectionStyle: React.CSSProperties = {
  marginTop: "30px",
  paddingTop: "26px",
  borderTop: "2px solid #e1e8e6",
};

const quotationHeadingRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  marginBottom: "16px",
};

const quotationHeadingStyle: React.CSSProperties = {
  margin: "0 0 4px",
  color: "#173f4c",
  fontSize: "18px",
};

const quotationSubtitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#7b898e",
  fontSize: "12px",
};

const quotationCountStyle: React.CSSProperties = {
  padding: "7px 11px",
  background: "#eef6f6",
  color: "#2a8392",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 800,
};

const noQuotesStyle: React.CSSProperties = {
  padding: "24px",
  border: "1px dashed #d5dfdc",
  borderRadius: "9px",
  color: "#7b898e",
  textAlign: "center",
  background: "#ffffff",
};

const quotationListStyle: React.CSSProperties = {
  display: "grid",
  gap: "9px",
};

const quotationCardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #dfe6e4",
  borderRadius: "9px",
  overflow: "hidden",
};

const quotationSummaryButtonStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  background: "#ffffff",
  padding: "14px 16px",
  display: "grid",
  gridTemplateColumns:
    "20px minmax(140px, 1.3fr) 110px 110px 100px 100px auto",
  gap: "16px",
  alignItems: "center",
  textAlign: "left",
  cursor: "pointer",
};

const quoteArrowStyle: React.CSSProperties = {
  color: "#2a8392",
  fontSize: "11px",
};

const quoteVendorStyle: React.CSSProperties = {
  color: "#173f4c",
  minWidth: 0,
};

const quoteMetricStyle: React.CSSProperties = {
  minWidth: 0,
};

const quoteMetricValueStyle: React.CSSProperties = {
  display: "block",
  color: "#43575d",
  fontSize: "12px",
};

const quoteMetricHighlightStyle: React.CSSProperties = {
  display: "block",
  color: "#173f4c",
  fontSize: "13px",
};

const quotationExpandedStyle: React.CSSProperties = {
  borderTop: "1px solid #edf0ef",
  padding: "20px",
  background: "#fbfbf9",
};

const quotationDetailGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: "40px",
};

const remarksStyle: React.CSSProperties = {
  marginTop: "18px",
  padding: "14px",
  background: "#ffffff",
  border: "1px solid #e4e9e7",
  borderRadius: "8px",
};

const pdfRowStyle: React.CSSProperties = {
  marginTop: "16px",
};

const pdfLinkStyle: React.CSSProperties = {
  color: "#2a8392",
  fontSize: "13px",
  fontWeight: 700,
};

const quoteActionRowStyle: React.CSSProperties = {
  marginTop: "20px",
  paddingTop: "18px",
  borderTop: "1px solid #e4e9e7",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
};

const quoteDecisionStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "9px",
};

const acceptButtonStyle: React.CSSProperties = {
  border: "none",
  background: "#173f4c",
  color: "#ffffff",
  borderRadius: "7px",
  padding: "9px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

const rejectButtonStyle: React.CSSProperties = {
  border: "1px solid #d9dddd",
  background: "#ffffff",
  color: "#a23c35",
  borderRadius: "7px",
  padding: "9px 16px",
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