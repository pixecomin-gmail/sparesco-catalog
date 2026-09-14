"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Vendor = {
  id: number;
  company_name: string;
  contact_person: string;
  email: string;
  product_limit: number;
  products_submitted: number;
};

type VendorProduct = {
  id: number;
  product_name: string;
  part_number: string;
  brand: string;
  category: string;
  price: string | null;
  currency: string | null;
  stock_status: string | null;
  lead_time: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  created_at: string;
};

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

export default function VendorDashboardPage() {
  const router = useRouter();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [enquiries, setEnquiries] = useState<VendorEnquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/vendor/session", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          router.replace("/vendor/login");
          return;
        }

        setVendor(data.vendor);

        const productsResponse = await fetch("/api/vendor/products", {
          method: "GET",
          cache: "no-store",
        });

        const productsData = await productsResponse.json();

        if (productsResponse.ok && productsData.success) {
          setProducts(productsData.products || []);
        }

        const enquiriesResponse = await fetch("/api/vendor/enquiries", {
          method: "GET",
          cache: "no-store",
        });

        const enquiriesData = await enquiriesResponse.json();

        if (enquiriesResponse.ok && enquiriesData.success) {
          setEnquiries(enquiriesData.enquiries || []);
        }
      } catch {
        router.replace("/vendor/login");
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [router]);

  if (loading) {
    return (
      <main style={{ padding: "60px 24px" }}>
        <p>Loading vendor dashboard...</p>
      </main>
    );
  }

  if (!vendor) {
    return null;
  }

  const remainingProducts =
    vendor.product_limit - vendor.products_submitted;

  return (
    <main
      style={{
        maxWidth: "1180px",
        margin: "0 auto",
        padding: "60px 24px",
      }}
    >
      <div style={{ marginBottom: "40px" }}>
        <span
          style={{
            color: "#2a8392",
            fontWeight: 700,
            fontSize: "13px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Sparesco Vendor Portal
        </span>

        <h1
          style={{
            color: "#173f4c",
            fontSize: "42px",
            margin: "12px 0 8px",
          }}
        >
          Welcome, {vendor.company_name}
        </h1>

        <p
          style={{
            color: "#63767c",
            margin: 0,
          }}
        >
          Signed in as {vendor.email}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginBottom: "40px",
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid #e1e6e4",
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#758388",
              fontSize: "13px",
            }}
          >
            Product Limit
          </p>

          <strong
            style={{
              display: "block",
              marginTop: "8px",
              fontSize: "32px",
              color: "#173f4c",
            }}
          >
            {vendor.product_limit}
          </strong>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #e1e6e4",
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#758388",
              fontSize: "13px",
            }}
          >
            Products Submitted
          </p>

          <strong
            style={{
              display: "block",
              marginTop: "8px",
              fontSize: "32px",
              color: "#173f4c",
            }}
          >
            {vendor.products_submitted}
          </strong>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #e1e6e4",
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#758388",
              fontSize: "13px",
            }}
          >
            Remaining Slots
          </p>

          <strong
            style={{
              display: "block",
              marginTop: "8px",
              fontSize: "32px",
              color: "#173f4c",
            }}
          >
            {remainingProducts}
          </strong>
        </div>
      </div>

      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e1e6e4",
          borderRadius: "18px",
          padding: "28px",
        }}
      >
        <h2
          style={{
            color: "#173f4c",
            marginTop: 0,
          }}
        >
          Vendor Actions
        </h2>

        <p
          style={{
            color: "#68797f",
            marginBottom: "24px",
          }}
        >
          Submit products, view enquiries and send quotations.
        </p>

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() =>
              router.push("/vendor/products/new")
            }
            disabled={remainingProducts <= 0}
            style={{
              border: 0,
              borderRadius: "10px",
              background: "#173f4c",
              color: "#ffffff",
              padding: "12px 20px",
              fontWeight: 700,
              cursor:
                remainingProducts > 0
                  ? "pointer"
                  : "not-allowed",
              opacity:
                remainingProducts > 0 ? 1 : 0.5,
            }}
          >
            Add Product
          </button>
        </div>

        {remainingProducts <= 0 && (
          <p
            style={{
              marginTop: "16px",
              marginBottom: 0,
              color: "#a23c35",
              fontSize: "13px",
            }}
          >
            You have reached your current product submission limit.
          </p>
        )}
      </section>

      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e1e6e4",
          borderRadius: "18px",
          padding: "28px",
          marginTop: "30px",
        }}
      >
        <h2
          style={{
            color: "#173f4c",
            marginTop: 0,
            marginBottom: "8px",
          }}
        >
          My Products
        </h2>

        <p
          style={{
            color: "#68797f",
            marginTop: 0,
            marginBottom: "24px",
          }}
        >
          Track the approval status of the products you have submitted.
        </p>

        {products.length === 0 ? (
          <p
            style={{
              color: "#758388",
              marginBottom: 0,
            }}
          >
            You have not submitted any products yet.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "750px",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid #e1e6e4",
                    textAlign: "left",
                  }}
                >
                  <th style={{ padding: "12px 10px" }}>Product</th>
                  <th style={{ padding: "12px 10px" }}>Part Number</th>
                  <th style={{ padding: "12px 10px" }}>Brand</th>
                  <th style={{ padding: "12px 10px" }}>Category</th>
                  <th style={{ padding: "12px 10px" }}>Submitted</th>
                  <th style={{ padding: "12px 10px" }}>Status</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => {
                  const statusLabel =
                    product.status === "pending"
                      ? "Under Review"
                      : product.status === "approved"
                        ? "Approved"
                        : "Rejected";

                  return (
                    <tr
                      key={product.id}
                      style={{
                        borderBottom: "1px solid #eef1f0",
                      }}
                    >
                      <td
                        style={{
                          padding: "14px 10px",
                          fontWeight: 700,
                          color: "#173f4c",
                        }}
                      >
                        {product.product_name}
                      </td>

                      <td style={{ padding: "14px 10px" }}>
                        {product.part_number}
                      </td>

                      <td style={{ padding: "14px 10px" }}>
                        {product.brand}
                      </td>

                      <td style={{ padding: "14px 10px" }}>
                        {product.category}
                      </td>

                      <td style={{ padding: "14px 10px" }}>
                        {new Date(product.created_at).toLocaleDateString()}
                      </td>

                      <td style={{ padding: "14px 10px" }}>
                        <strong
                          style={{
                            color:
                              product.status === "approved"
                                ? "#26734d"
                                : product.status === "rejected"
                                  ? "#a23c35"
                                  : "#9a6b00",
                          }}
                        >
                          {statusLabel}
                        </strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e1e6e4",
          borderRadius: "18px",
          padding: "28px",
          marginTop: "30px",
        }}
      >
        <h2
          style={{
            color: "#173f4c",
            marginTop: 0,
            marginBottom: "8px",
          }}
        >
          My Enquiries
        </h2>

        <p
          style={{
            color: "#68797f",
            marginTop: 0,
            marginBottom: "24px",
          }}
        >
          View customer enquiries matched to your approved products.
        </p>

        {enquiries.length === 0 ? (
          <p
            style={{
              color: "#758388",
              marginBottom: 0,
            }}
          >
            No enquiries have been assigned to you yet.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "900px",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid #e1e6e4",
                    textAlign: "left",
                  }}
                >
                  <th style={{ padding: "12px 10px" }}>Product</th>
                  <th style={{ padding: "12px 10px" }}>Part Number</th>
                  <th style={{ padding: "12px 10px" }}>Quantity</th>
                  <th style={{ padding: "12px 10px" }}>Company</th>
                  <th style={{ padding: "12px 10px" }}>Customer</th>
                  <th style={{ padding: "12px 10px" }}>Received</th>
                  <th style={{ padding: "12px 10px" }}>Status</th>
                </tr>
              </thead>

              <tbody>
                {enquiries.map((enquiry) => (
                  <tr
                    key={enquiry.id}
                    style={{
                      borderBottom: "1px solid #eef1f0",
                    }}
                  >
                    <td
                      style={{
                        padding: "14px 10px",
                        fontWeight: 700,
                        color: "#173f4c",
                      }}
                    >
                      {enquiry.product_name || "-"}
                    </td>

                    <td style={{ padding: "14px 10px" }}>
                      {enquiry.part_number || "-"}
                    </td>

                    <td style={{ padding: "14px 10px" }}>
                      {enquiry.quantity || "-"}
                    </td>

                    <td style={{ padding: "14px 10px" }}>
                      {enquiry.company_name || "-"}
                    </td>

                    <td style={{ padding: "14px 10px" }}>
                      {enquiry.customer_name}
                    </td>

                    <td style={{ padding: "14px 10px" }}>
                      {new Date(enquiry.created_at).toLocaleDateString()}
                    </td>

                    <td style={{ padding: "14px 10px" }}>
                      <strong
                        style={{
                          color:
                            enquiry.vendor_status === "responded"
                              ? "#26734d"
                              : "#9a6b00",
                        }}
                      >
                        {enquiry.vendor_status === "responded"
                          ? "Responded"
                          : "New"}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}