"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export const runtime = "edge";

type VendorEnquiry = {
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
  enquiry_status: string;
  vendor_status: string;
  created_at: string;
  sent_at: string | null;
  viewed_at: string | null;
  responded_at: string | null;
};

export default function VendorEnquiryPage() {
  const params = useParams();
  const router = useRouter();

  const [enquiry, setEnquiry] = useState<VendorEnquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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
      } catch (err) {
        console.error("Unable to load enquiry:", err);
        setError("Unable to load enquiry.");
      } finally {
        setLoading(false);
      }
    };

    loadEnquiry();
  }, [params.id]);

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
        <h1
          style={{
            marginTop: 0,
            color: "#173f4c",
          }}
        >
          Enquiry #{enquiry.id}
        </h1>

        <p
          style={{
            color: "#68797f",
            marginBottom: "30px",
          }}
        >
          Received on{" "}
          {new Date(enquiry.created_at).toLocaleDateString()}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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
            <strong>Quantity</strong>
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

          <div>
            <strong>Customer Name</strong>
            <p>{enquiry.customer_name}</p>
          </div>

          <div>
            <strong>Company</strong>
            <p>{enquiry.company_name || "-"}</p>
          </div>

          <div>
            <strong>Email</strong>
            <p>{enquiry.customer_email}</p>
          </div>

          <div>
            <strong>Phone</strong>
            <p>{enquiry.customer_phone || "-"}</p>
          </div>
        </div>

        <div
          style={{
            marginTop: "30px",
            paddingTop: "24px",
            borderTop: "1px solid #e1e6e4",
          }}
        >
          <strong>Customer Message</strong>

          <p
            style={{
              marginTop: "10px",
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
            }}
          >
            {enquiry.message || "No message provided."}
          </p>
        </div>

        <div
          style={{
            marginTop: "30px",
            paddingTop: "24px",
            borderTop: "1px solid #e1e6e4",
          }}
        >
          <button
            type="button"
            disabled
            style={{
              padding: "13px 22px",
              borderRadius: "9px",
              border: "none",
              background: "#173f4c",
              color: "#ffffff",
              fontWeight: 700,
              opacity: 0.55,
              cursor: "not-allowed",
            }}
          >
            Submit Quotation — Coming Next
          </button>
        </div>
      </div>
    </main>
  );
}