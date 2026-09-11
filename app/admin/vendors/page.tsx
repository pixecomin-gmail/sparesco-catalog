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

  useEffect(() => {
    loadVendors();
  }, []);

  async function loadVendors() {
    try {
      const response = await fetch("/api/admin/vendors");
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Unable to load vendors.");
        return;
      }

      setVendors(data.vendors || []);
    } catch (error) {
      console.error(error);
      alert("Unable to load vendors.");
    } finally {
      setLoading(false);
    }
  }

  async function updateVendorStatus(
    vendorId: number,
    status: "approved" | "rejected"
  ) {
    try {
      setUpdatingId(vendorId);

      const response = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Unable to update vendor.");
        return;
      }

      setVendors((current) =>
        current.map((vendor) =>
          vendor.id === vendorId ? { ...vendor, status } : vendor
        )
      );

      alert(`Vendor ${status} successfully.`);
    } catch (error) {
      console.error(error);
      alert("Unable to update vendor.");
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <main style={{ padding: "40px" }}>
        <h1>Vendors</h1>
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "40px", overflowX: "auto" }}>
      <h1>Vendors</h1>

      {vendors.length === 0 ? (
        <p>No vendor applications found.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "20px",
          }}
        >
          <thead>
            <tr>
              <th style={cellStyle}>ID</th>
              <th style={cellStyle}>Company</th>
              <th style={cellStyle}>Contact Person</th>
              <th style={cellStyle}>Email</th>
              <th style={cellStyle}>Phone</th>
              <th style={cellStyle}>City</th>
              <th style={cellStyle}>Country</th>
              <th style={cellStyle}>GST / Tax</th>
              <th style={cellStyle}>Status</th>
              <th style={cellStyle}>Product Limit</th>
              <th style={cellStyle}>Submitted</th>
              <th style={cellStyle}>Created</th>
              <th style={cellStyle}>Action</th>
            </tr>
          </thead>

          <tbody>
            {vendors.map((vendor) => (
              <tr key={vendor.id}>
                <td style={cellStyle}>{vendor.id}</td>
                <td style={cellStyle}>{vendor.company_name}</td>
                <td style={cellStyle}>{vendor.contact_person}</td>
                <td style={cellStyle}>{vendor.email}</td>
                <td style={cellStyle}>{vendor.phone}</td>
                <td style={cellStyle}>{vendor.city}</td>
                <td style={cellStyle}>{vendor.country}</td>
                <td style={cellStyle}>{vendor.gst_number}</td>
                <td style={cellStyle}>{vendor.status}</td>
                <td style={cellStyle}>{vendor.product_limit}</td>
                <td style={cellStyle}>{vendor.products_submitted}</td>
                <td style={cellStyle}>{vendor.created_at}</td>

                <td style={cellStyle}>
                  <div style={{ display: "flex", gap: "8px" }}>
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
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

const cellStyle: React.CSSProperties = {
  border: "1px solid #ccc",
  padding: "10px",
  textAlign: "left",
  whiteSpace: "nowrap",
};