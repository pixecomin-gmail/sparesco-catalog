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
      <main
        style={{
          maxWidth: "1450px",
          margin: "0 auto",
          padding: "50px 24px",
        }}
      >
        <p>Loading vendors...</p>
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
          Vendors
        </h1>

        <p
          style={{
            margin: 0,
            color: "#67797f",
          }}
        >
          Review and manage vendor registrations.
        </p>
      </div>

      {message && (
        <div
          style={{
            marginBottom: "20px",
            padding: "12px 15px",
            borderRadius: "10px",
            background: "#eef8f3",
            border: "1px solid #d3ebdf",
            color: "#286647",
          }}
        >
          {message}
        </div>
      )}

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

      <div
        style={{
          overflowX: "auto",
          background: "#ffffff",
          border: "1px solid #e1e6e4",
          borderRadius: "16px",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "1250px",
          }}
        >
          <thead>
            <tr
              style={{
                background: "#f7f5ef",
                textAlign: "left",
              }}
            >
              {[
                "Company",
                "Contact",
                "Email",
                "Phone",
                "Location",
                "GST / Tax",
                "Status",
                "Product Limit",
                "Submitted",
                "Created",
                "Actions",
              ].map((heading) => (
                <th
                  key={heading}
                  style={{
                    padding: "14px 16px",
                    color: "#173f4c",
                    fontSize: "13px",
                    borderBottom: "1px solid #e1e6e4",
                    whiteSpace: "nowrap",
                  }}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {vendors.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  style={{
                    padding: "30px",
                    textAlign: "center",
                    color: "#718086",
                  }}
                >
                  No vendor applications found.
                </td>
              </tr>
            ) : (
              vendors.map((vendor) => (
                <tr key={vendor.id}>
                  <td style={cellStyle}>
                    <strong style={{ color: "#173f4c" }}>
                      {vendor.company_name}
                    </strong>
                  </td>

                  <td style={cellStyle}>{vendor.contact_person}</td>

                  <td style={cellStyle}>{vendor.email}</td>

                  <td style={cellStyle}>{vendor.phone || "—"}</td>

                  <td style={cellStyle}>
                    {[vendor.city, vendor.country]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </td>

                  <td style={cellStyle}>{vendor.gst_number || "—"}</td>

                  <td style={cellStyle}>
                    <strong>{vendor.status}</strong>
                  </td>

                  <td style={cellStyle}>{vendor.product_limit}</td>

                  <td style={cellStyle}>{vendor.products_submitted}</td>

                  <td style={cellStyle}>
                    {vendor.created_at
                      ? new Date(vendor.created_at).toLocaleDateString()
                      : "—"}
                  </td>

                  <td style={cellStyle}>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                      }}
                    >
                      <button
                        type="button"
                        disabled={
                          updatingId === vendor.id ||
                          vendor.status === "approved"
                        }
                        onClick={() =>
                          updateVendorStatus(vendor.id, "approved")
                        }
                      >
                        Approve
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
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

const cellStyle: React.CSSProperties = {
  padding: "16px",
  borderBottom: "1px solid #edf0ef",
  color: "#4d6066",
  fontSize: "14px",
  verticalAlign: "top",
  whiteSpace: "nowrap",
};