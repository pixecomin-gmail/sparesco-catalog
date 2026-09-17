"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export const runtime = "edge";

type VendorEnquiry = {
  id: number;
  product_name: string | null;
  part_number: string | null;
  product_handle: string | null;
  quantity: string | null;
  enquiry_status: string;
  vendor_status: string;
  created_at: string;
  sent_at: string | null;
  viewed_at: string | null;
  responded_at: string | null;
};

type VendorQuote = {
  id: number;
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
  updated_at: string;
};

export default function VendorEnquiryPage() {
  const params = useParams();
  const router = useRouter();

  const [enquiry, setEnquiry] = useState<VendorEnquiry | null>(null);
  const [quote, setQuote] = useState<VendorQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [quotedQuantity, setQuotedQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [stockAvailable, setStockAvailable] = useState(true);
  const [leadTime, setLeadTime] = useState("");
  const [moq, setMoq] = useState("");
  const [condition, setCondition] = useState("New");
  const [manufacturerBrand, setManufacturerBrand] = useState("");
  const [countryOfOrigin, setCountryOfOrigin] = useState("");
  const [quoteValidity, setQuoteValidity] = useState("");
  const [shippingIncluded, setShippingIncluded] = useState("no");
  const [taxesIncluded, setTaxesIncluded] = useState("no");
  const [vendorRemarks, setVendorRemarks] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const loadEnquiry = async () => {
    try {
      const id = params.id;

      const response = await fetch(`/api/vendor/enquiries/${id}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Unable to load enquiry.");
        return;
      }

      setEnquiry(data.enquiry);
      setQuote(data.quote || null);

      if (data.enquiry.quantity) {
        setQuotedQuantity(String(data.enquiry.quantity));
      }
    } catch (err) {
      console.error("Unable to load enquiry:", err);
      setError("Unable to load enquiry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnquiry();
  }, [params.id]);

  const totalPrice =
    Number(quotedQuantity) > 0 && Number(unitPrice) >= 0
      ? Number(quotedQuantity) * Number(unitPrice)
      : 0;

  const submitQuotation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!enquiry || submitting || quote) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch(
        `/api/vendor/enquiries/${enquiry.id}/quote`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quoted_quantity: quotedQuantity,
            unit_price: unitPrice,
            currency,
            stock_available: stockAvailable,
            lead_time: leadTime,
            moq,
            condition,
            manufacturer_brand: manufacturerBrand,
            country_of_origin: countryOfOrigin,
            quote_validity: quoteValidity,
            shipping_included: shippingIncluded,
            taxes_included: taxesIncluded,
            vendor_remarks: vendorRemarks,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setSubmitError(data.error || "Unable to submit quotation.");
        return;
      }

      await loadEnquiry();
    } catch (err) {
      console.error("Quotation submission error:", err);
      setSubmitError("Unable to submit quotation.");
    } finally {
      setSubmitting(false);
    }
  };

  const fieldStyle = {
    width: "100%",
    padding: "12px",
    border: "1px solid #ccd6d3",
    borderRadius: "8px",
    boxSizing: "border-box" as const,
    marginTop: "7px",
    background: "#ffffff",
  };

  const labelStyle = {
    display: "block",
    fontWeight: 700,
    color: "#173f4c",
  };

  const detailStyle = {
    padding: "15px",
    background: "#f7f9f8",
    borderRadius: "9px",
  };

  if (loading) {
    return (
      <main
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "50px 20px",
        }}
      >
        <p>Loading enquiry...</p>
      </main>
    );
  }

  if (error || !enquiry) {
    return (
      <main
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "50px 20px",
        }}
      >
        <h1 style={{ color: "#173f4c" }}>Enquiry</h1>

        <p style={{ color: "#b42318" }}>
          {error || "Enquiry not found."}
        </p>

        <button
          type="button"
          onClick={() => router.push("/vendor/dashboard")}
          style={{
            marginTop: "20px",
            padding: "12px 18px",
            borderRadius: "8px",
            border: "none",
            background: "#173f4c",
            color: "#ffffff",
            cursor: "pointer",
          }}
        >
          Back to Dashboard
        </button>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "50px 20px",
      }}
    >
      <button
        type="button"
        onClick={() => router.push("/vendor/dashboard")}
        style={{
          marginBottom: "24px",
          background: "transparent",
          border: "none",
          color: "#2a8392",
          cursor: "pointer",
          padding: 0,
          fontWeight: 700,
        }}
      >
        ← Back to Dashboard
      </button>

      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e1e6e4",
          borderRadius: "18px",
          padding: "30px",
        }}
      >
        <h1 style={{ marginTop: 0, color: "#173f4c" }}>
          Enquiry #{enquiry.id}
        </h1>

        <p style={{ color: "#68797f", marginBottom: "30px" }}>
          Received on {new Date(enquiry.created_at).toLocaleDateString()}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "22px",
          }}
        >
          <div>
            <strong>Product</strong>
            <p>{enquiry.product_name || "-"}</p>
          </div>

          <div>
            <strong>Part Number</strong>
            <p>{enquiry.part_number || "-"}</p>
          </div>

          <div>
            <strong>Required Quantity</strong>
            <p>{enquiry.quantity || "-"}</p>
          </div>

          <div>
            <strong>Status</strong>
            <p>
              {enquiry.responded_at
                ? "Responded"
                : enquiry.viewed_at
                  ? "Viewed"
                  : "New"}
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: "30px",
            paddingTop: "30px",
            borderTop: "1px solid #e1e6e4",
          }}
        >
          {quote ? (
            <>
              <h2 style={{ color: "#173f4c", marginTop: 0 }}>
                Your Quotation
              </h2>

              <div
                style={{
                  marginTop: "20px",
                  marginBottom: "25px",
                  padding: "16px",
                  background: "#eef8f2",
                  border: "1px solid #b9dfc8",
                  borderRadius: "10px",
                }}
              >
                <strong>Quotation submitted successfully.</strong>

                <div style={{ marginTop: "7px" }}>
                  Admin Status:{" "}
                  <strong>
                    {quote.admin_status
                      ? quote.admin_status.charAt(0).toUpperCase() +
                        quote.admin_status.slice(1)
                      : "Pending"}
                  </strong>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "15px",
                }}
              >
                <div style={detailStyle}>
                  <strong>Quoted Quantity</strong>
                  <p>{quote.quoted_quantity ?? "-"}</p>
                </div>

                <div style={detailStyle}>
                  <strong>Unit Price</strong>
                  <p>
                    {quote.currency || ""}{" "}
                    {quote.unit_price != null
                      ? Number(quote.unit_price).toFixed(2)
                      : "-"}
                  </p>
                </div>

                <div style={detailStyle}>
                  <strong>Total Price</strong>
                  <p>
                    {quote.currency || ""}{" "}
                    {quote.total_price != null
                      ? Number(quote.total_price).toFixed(2)
                      : "-"}
                  </p>
                </div>

                <div style={detailStyle}>
                  <strong>Stock Available</strong>
                  <p>{quote.stock_available ? "Yes" : "No"}</p>
                </div>

                <div style={detailStyle}>
                  <strong>Lead Time</strong>
                  <p>{quote.lead_time || "-"}</p>
                </div>

                <div style={detailStyle}>
                  <strong>MOQ</strong>
                  <p>{quote.moq ?? "-"}</p>
                </div>

                <div style={detailStyle}>
                  <strong>Condition</strong>
                  <p>{quote.condition || "-"}</p>
                </div>

                <div style={detailStyle}>
                  <strong>Manufacturer / Brand</strong>
                  <p>{quote.manufacturer_brand || "-"}</p>
                </div>

                <div style={detailStyle}>
                  <strong>Country of Origin</strong>
                  <p>{quote.country_of_origin || "-"}</p>
                </div>

                <div style={detailStyle}>
                  <strong>Quote Validity</strong>
                  <p>{quote.quote_validity || "-"}</p>
                </div>

                <div style={detailStyle}>
                  <strong>Shipping Included</strong>
                  <p>
                    {quote.shipping_included === "yes" ? "Yes" : "No"}
                  </p>
                </div>

                <div style={detailStyle}>
                  <strong>Taxes Included</strong>
                  <p>
                    {quote.taxes_included === "yes" ? "Yes" : "No"}
                  </p>
                </div>

                <div style={detailStyle}>
                  <strong>Submitted On</strong>
                  <p>
                    {quote.submitted_at
                      ? new Date(
                          quote.submitted_at
                        ).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
              </div>

              {quote.vendor_remarks && (
                <div
                  style={{
                    marginTop: "20px",
                    padding: "18px",
                    background: "#f7f9f8",
                    borderRadius: "9px",
                  }}
                >
                  <strong>Remarks</strong>
                  <p
                    style={{
                      marginBottom: 0,
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.6,
                    }}
                  >
                    {quote.vendor_remarks}
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <h2 style={{ color: "#173f4c", marginTop: 0 }}>
                Submit Quotation
              </h2>

              <form onSubmit={submitQuotation}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "20px",
                    marginTop: "24px",
                  }}
                >
                  <label style={labelStyle}>
                    Quoted Quantity *
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={quotedQuantity}
                      onChange={(e) =>
                        setQuotedQuantity(e.target.value)
                      }
                      style={fieldStyle}
                    />
                  </label>

                  <label style={labelStyle}>
                    Unit Price *
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      style={fieldStyle}
                    />
                  </label>

                  <label style={labelStyle}>
                    Currency *
                    <select
                      required
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      style={fieldStyle}
                    >
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="AED">AED</option>
                    </select>
                  </label>

                  <label style={labelStyle}>
                    Total Price
                    <input
                      type="text"
                      readOnly
                      value={
                        unitPrice && quotedQuantity
                          ? `${currency} ${totalPrice.toFixed(2)}`
                          : ""
                      }
                      style={{
                        ...fieldStyle,
                        background: "#f3f5f4",
                      }}
                    />
                  </label>

                  <label style={labelStyle}>
                    Stock Available
                    <select
                      value={stockAvailable ? "yes" : "no"}
                      onChange={(e) =>
                        setStockAvailable(e.target.value === "yes")
                      }
                      style={fieldStyle}
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </label>

                  <label style={labelStyle}>
                    Lead Time
                    <input
                      type="text"
                      placeholder="e.g. 7-10 days"
                      value={leadTime}
                      onChange={(e) => setLeadTime(e.target.value)}
                      style={fieldStyle}
                    />
                  </label>

                  <label style={labelStyle}>
                    MOQ
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={moq}
                      onChange={(e) => setMoq(e.target.value)}
                      style={fieldStyle}
                    />
                  </label>

                  <label style={labelStyle}>
                    Condition
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      style={fieldStyle}
                    >
                      <option value="New">New</option>
                      <option value="Unused">Unused</option>
                      <option value="Refurbished">Refurbished</option>
                      <option value="Used">Used</option>
                    </select>
                  </label>

                  <label style={labelStyle}>
                    Manufacturer / Brand
                    <input
                      type="text"
                      value={manufacturerBrand}
                      onChange={(e) =>
                        setManufacturerBrand(e.target.value)
                      }
                      style={fieldStyle}
                    />
                  </label>

                  <label style={labelStyle}>
                    Country of Origin
                    <input
                      type="text"
                      value={countryOfOrigin}
                      onChange={(e) =>
                        setCountryOfOrigin(e.target.value)
                      }
                      style={fieldStyle}
                    />
                  </label>

                  <label style={labelStyle}>
                    Quote Validity
                    <input
                      type="text"
                      placeholder="e.g. 30 days"
                      value={quoteValidity}
                      onChange={(e) =>
                        setQuoteValidity(e.target.value)
                      }
                      style={fieldStyle}
                    />
                  </label>

                  <label style={labelStyle}>
                    Shipping Included
                    <select
                      value={shippingIncluded}
                      onChange={(e) =>
                        setShippingIncluded(e.target.value)
                      }
                      style={fieldStyle}
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </label>

                  <label style={labelStyle}>
                    Taxes Included
                    <select
                      value={taxesIncluded}
                      onChange={(e) =>
                        setTaxesIncluded(e.target.value)
                      }
                      style={fieldStyle}
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </label>
                </div>

                <label
                  style={{
                    ...labelStyle,
                    marginTop: "20px",
                  }}
                >
                  Remarks
                  <textarea
                    rows={5}
                    value={vendorRemarks}
                    onChange={(e) =>
                      setVendorRemarks(e.target.value)
                    }
                    placeholder="Add any additional quotation details..."
                    style={{
                      ...fieldStyle,
                      resize: "vertical",
                    }}
                  />
                </label>

                {submitError && (
                  <p
                    style={{
                      color: "#b42318",
                      marginTop: "18px",
                      marginBottom: 0,
                    }}
                  >
                    {submitError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    marginTop: "24px",
                    padding: "13px 22px",
                    borderRadius: "9px",
                    border: "none",
                    background: "#173f4c",
                    color: "#ffffff",
                    fontWeight: 700,
                    cursor: submitting
                      ? "not-allowed"
                      : "pointer",
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  {submitting
                    ? "Submitting..."
                    : "Submit Quotation"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}