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
  enquiry_reference: string | null;
  batch_reference: string | null;
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

type EnquiryEmailRecipient = {
  id: number;
  email: string;
  is_active: number;
  created_at: string;
};

type Filter = "all" | "open" | "closed";

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const [openQuote, setOpenQuote] = useState<number | null>(null);

  const [updatingEnquiryId, setUpdatingEnquiryId] =
    useState<number | null>(null);

  const [emailListEnquiry, setEmailListEnquiry] =
    useState<Enquiry | null>(null);

  const [emailRecipients, setEmailRecipients] =
    useState<EnquiryEmailRecipient[]>([]);

  const [selectedRecipientIds, setSelectedRecipientIds] =
    useState<number[]>([]);

  const [recipientsExpanded, setRecipientsExpanded] =
    useState(false);

  const [loadingRecipients, setLoadingRecipients] =
    useState(false);

  const [recipientSearch, setRecipientSearch] = useState("");

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

  async function openEmailListModal(enquiry: Enquiry) {
    setEmailListEnquiry(enquiry);
    setRecipientsExpanded(false);
    setRecipientSearch("");
    setLoadingRecipients(true);
    setError("");

    try {
      const response = await fetch("/api/admin/enquiry-email-list", {
        cache: "no-store",
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (!response.ok) {
        setError(data.error || "Unable to load enquiry email list.");
        setEmailListEnquiry(null);
        return;
      }

      const activeRecipients = (data.recipients || []).filter(
        (recipient: EnquiryEmailRecipient) =>
          Number(recipient.is_active) === 1
      );

      setEmailRecipients(activeRecipients);

      // Everyone is included by default.
      setSelectedRecipientIds(
        activeRecipients.map(
          (recipient: EnquiryEmailRecipient) => recipient.id
        )
      );
    } catch {
      setError("Unable to load enquiry email list.");
      setEmailListEnquiry(null);
    } finally {
      setLoadingRecipients(false);
    }
  }

  function closeEmailListModal() {
    setEmailListEnquiry(null);
    setEmailRecipients([]);
    setSelectedRecipientIds([]);
    setRecipientsExpanded(false);
    setRecipientSearch("");
  }

  function toggleEmailRecipient(recipientId: number) {
    setSelectedRecipientIds((current) =>
      current.includes(recipientId)
        ? current.filter((id) => id !== recipientId)
        : [...current, recipientId]
    );
  }

  function confirmEmailRecipients() {
    if (!emailListEnquiry) return;

    // Email sending will be connected later.
    const enquiryLabel =
      emailListEnquiry.enquiry_reference ||
      `Enquiry #${emailListEnquiry.id}`;

    setMessage(
      `${selectedRecipientIds.length} recipient${selectedRecipientIds.length === 1 ? "" : "s"
      } selected for ${enquiryLabel}.`
    );

    closeEmailListModal();
  }

  const visibleEmailRecipients = useMemo(() => {
    const query = recipientSearch.trim().toLowerCase();

    if (!query) {
      return emailRecipients;
    }

    return emailRecipients.filter((recipient) =>
      recipient.email.toLowerCase().includes(query)
    );
  }, [emailRecipients, recipientSearch]);

  const visibleEnquiries = useMemo(() => {
    const query = search.trim().toLowerCase();

    const normalizeSearch = (value: unknown) =>
      String(value ?? "")
        .toLowerCase()
        .replace(/[\s-]+/g, "");

    const normalizedQuery = normalizeSearch(search);

    return enquiries.filter((enquiry) => {
      const status = enquiry.status?.toLowerCase();

      const matchesFilter =
        filter === "all"
          ? true
          : filter === "closed"
            ? status === "closed"
            : status !== "closed";

      if (!matchesFilter) return false;

      if (!query) return true;

      const enquiryFields = [
        enquiry.id,
        enquiry.enquiry_reference,
        enquiry.batch_reference,
        enquiry.customer_name,
        enquiry.customer_email,
        enquiry.customer_phone,
        enquiry.company_name,
        enquiry.product_name,
        enquiry.part_number,
        enquiry.product_handle,
        enquiry.quantity,
        enquiry.message,
        enquiry.status,
      ];

      const quoteFields = (enquiry.quotations || []).flatMap((quote) => [
        quote.vendor_company,
        quote.vendor_contact,
        quote.vendor_email,
        quote.vendor_phone,
        quote.manufacturer_brand,
        quote.country_of_origin,
        quote.condition,
        quote.lead_time,
        quote.vendor_remarks,
      ]);

      const searchableFields = [
        ...enquiryFields,
        ...quoteFields,
      ];

      const regularMatch = searchableFields.some((field) =>
        String(field ?? "")
          .toLowerCase()
          .includes(query)
      );

      const normalizedMatch = searchableFields.some((field) =>
        normalizeSearch(field).includes(normalizedQuery)
      );

      return regularMatch || normalizedMatch;
    });
  }, [enquiries, filter, search]);

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

      <div style={searchWrapStyle}>
        <span style={searchIconStyle}>⌕</span>

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search enquiry, customer, product, part number, vendor..."
          style={searchInputStyle}
        />
      </div>

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
                        {enquiry.enquiry_reference || `ENQUIRY #${enquiry.id}`}
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
                    />

                    <EnquiryMetric
                      label="Part Number"
                      value={enquiry.part_number || "—"}
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

                    <div style={enquiryActionsStyle}>
                      <button
                        type="button"
                        onClick={() => openEmailListModal(enquiry)}
                        style={emailListButtonStyle}
                      >
                        Email Enquiry List
                      </button>

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

      {emailListEnquiry && (
        <div
          style={modalOverlayStyle}
          onClick={closeEmailListModal}
        >
          <div
            style={modalStyle}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={modalHeaderStyle}>
              <div>
                <h2 style={modalTitleStyle}>
                  Email{" "}
                  {emailListEnquiry.enquiry_reference ||
                    `Enquiry #${emailListEnquiry.id}`}
                </h2>

                <p style={modalSubtitleStyle}>
                  Select who should receive this enquiry.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEmailListModal}
                style={modalCloseStyle}
              >
                ×
              </button>
            </div>

            {loadingRecipients ? (
              <div style={modalLoadingStyle}>
                Loading recipients...
              </div>
            ) : emailRecipients.length === 0 ? (
              <div style={modalEmptyStyle}>
                No active recipients are available in the Enquiry Email List.
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setRecipientsExpanded((current) => !current)
                  }
                  style={recipientAccordionButtonStyle}
                >
                  <span>
                    Recipients
                    <span style={recipientCountStyle}>
                      {selectedRecipientIds.length} of{" "}
                      {emailRecipients.length} selected
                    </span>
                  </span>

                  <span style={recipientArrowStyle}>
                    {recipientsExpanded ? "▲" : "▼"}
                  </span>
                </button>

                {recipientsExpanded && (
                  <>
                    <div style={recipientSearchWrapStyle}>
                      <span style={recipientSearchIconStyle}>⌕</span>

                      <input
                        type="search"
                        value={recipientSearch}
                        onChange={(event) =>
                          setRecipientSearch(event.target.value)
                        }
                        placeholder="Search email..."
                        style={recipientSearchInputStyle}
                      />
                    </div>

                    <div style={recipientListStyle}>
                      {visibleEmailRecipients.length === 0 ? (
                        <div style={recipientSearchEmptyStyle}>
                          No email found.
                        </div>
                      ) : (
                        visibleEmailRecipients.map((recipient) => {
                          const selected =
                            selectedRecipientIds.includes(recipient.id);

                          return (
                            <label
                              key={recipient.id}
                              style={recipientRowStyle}
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() =>
                                  toggleEmailRecipient(recipient.id)
                                }
                                style={recipientCheckboxStyle}
                              />

                              <span style={recipientEmailStyle}>
                                {recipient.email}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </>
                )}

                <div style={selectedSummaryStyle}>
                  {selectedRecipientIds.length} of{" "}
                  {emailRecipients.length} recipients selected
                </div>
              </>
            )}

            <div style={modalFooterStyle}>
              <button
                type="button"
                onClick={closeEmailListModal}
                style={cancelModalButtonStyle}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  loadingRecipients ||
                  selectedRecipientIds.length === 0
                }
                onClick={confirmEmailRecipients}
                style={{
                  ...confirmRecipientsButtonStyle,
                  opacity:
                    loadingRecipients ||
                      selectedRecipientIds.length === 0
                      ? 0.45
                      : 1,
                }}
              >
                Confirm Recipients
              </button>
            </div>
          </div>
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
const searchWrapStyle: React.CSSProperties = {
  position: "relative",
  marginBottom: "12px",
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
    "minmax(170px,1.5fr) minmax(130px,1fr) 80px minmax(160px,1.3fr) 110px 70px",
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
  fontWeight: 400,
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
    "24px minmax(180px,1.6fr) 130px 130px 120px 120px",
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
    "24px minmax(180px,1.6fr) 130px 130px 120px 120px",
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

const enquiryActionsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexShrink: 0,
};

const emailListButtonStyle: React.CSSProperties = {
  border: "1px solid #bfd3d5",
  background: "#ffffff",
  color: "#2a8392",
  borderRadius: "7px",
  padding: "8px 13px",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  background: "rgba(20, 39, 45, 0.42)",
};

const modalStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "520px",
  maxHeight: "80vh",
  overflow: "auto",
  background: "#ffffff",
  border: "1px solid #dfe6e4",
  borderRadius: "12px",
  boxShadow: "0 18px 50px rgba(23,63,76,0.18)",
};

const modalHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  padding: "20px 22px 16px",
  borderBottom: "1px solid #edf1f0",
};

const modalTitleStyle: React.CSSProperties = {
  margin: "0 0 4px",
  color: "#173f4c",
  fontSize: "18px",
};

const modalSubtitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#718187",
  fontSize: "12px",
};

const modalCloseStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#718187",
  fontSize: "24px",
  lineHeight: 1,
  cursor: "pointer",
};

const modalLoadingStyle: React.CSSProperties = {
  padding: "30px 22px",
  color: "#718187",
  fontSize: "12px",
  textAlign: "center",
};

const modalEmptyStyle: React.CSSProperties = {
  margin: "18px 22px",
  padding: "20px",
  border: "1px dashed #d6dfdd",
  borderRadius: "8px",
  color: "#879499",
  fontSize: "12px",
  textAlign: "center",
};

const recipientAccordionButtonStyle: React.CSSProperties = {
  width: "calc(100% - 44px)",
  margin: "18px 22px 0",
  padding: "13px 14px",
  border: "1px solid #dfe6e4",
  borderRadius: "8px",
  background: "#f9fbfa",
  color: "#173f4c",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  textAlign: "left",
  fontSize: "12px",
  cursor: "pointer",
};

const recipientCountStyle: React.CSSProperties = {
  display: "block",
  marginTop: "3px",
  color: "#7d8c91",
  fontSize: "10px",
  fontWeight: 400,
};

const recipientArrowStyle: React.CSSProperties = {
  color: "#2a8392",
  fontSize: "10px",
};

const recipientListStyle: React.CSSProperties = {
  margin: "8px 22px 0",
  border: "1px solid #e1e8e6",
  borderRadius: "8px",
  overflowY: "auto",
  overflowX: "hidden",
  maxHeight: "240px",
};

const recipientRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "11px 13px",
  borderBottom: "1px solid #edf1f0",
  cursor: "pointer",
};

const recipientCheckboxStyle: React.CSSProperties = {
  width: "15px",
  height: "15px",
  accentColor: "#2a8392",
  cursor: "pointer",
};

const recipientEmailStyle: React.CSSProperties = {
  color: "#465b61",
  fontSize: "12px",
  overflowWrap: "anywhere",
};

const selectedSummaryStyle: React.CSSProperties = {
  padding: "12px 22px 2px",
  color: "#718187",
  fontSize: "11px",
};

const modalFooterStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "8px",
  marginTop: "18px",
  padding: "15px 22px",
  borderTop: "1px solid #edf1f0",
};

const cancelModalButtonStyle: React.CSSProperties = {
  border: "1px solid #d9e1df",
  background: "#ffffff",
  color: "#617278",
  borderRadius: "7px",
  padding: "8px 13px",
  fontSize: "11px",
  cursor: "pointer",
};

const confirmRecipientsButtonStyle: React.CSSProperties = {
  border: "none",
  background: "#173f4c",
  color: "#ffffff",
  borderRadius: "7px",
  padding: "8px 14px",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
};

const recipientSearchWrapStyle: React.CSSProperties = {
  position: "relative",
  margin: "10px 22px 0",
};

const recipientSearchIconStyle: React.CSSProperties = {
  position: "absolute",
  left: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  color: "#819095",
  fontSize: "15px",
  pointerEvents: "none",
};

const recipientSearchInputStyle: React.CSSProperties = {
  width: "100%",
  height: "38px",
  padding: "0 12px 0 35px",
  border: "1px solid #d9e1df",
  borderRadius: "7px",
  background: "#ffffff",
  color: "#173f4c",
  fontSize: "12px",
  outline: "none",
  boxSizing: "border-box",
};

const recipientSearchEmptyStyle: React.CSSProperties = {
  padding: "20px",
  color: "#879499",
  fontSize: "12px",
  textAlign: "center",
};