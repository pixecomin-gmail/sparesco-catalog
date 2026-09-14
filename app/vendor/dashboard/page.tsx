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

export default function VendorDashboardPage() {
  const router = useRouter();

  const [vendor, setVendor] = useState<Vendor | null>(null);
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
    </main>
  );
}