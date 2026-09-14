"use client";
import "./vendor-product.css";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VendorAddProductPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    product_name: "",
    part_number: "",
    brand: "",
    category: "",
    description: "",
    price: "",
    currency: "USD",
    stock_status: "",
    lead_time: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const updateField = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const submitProduct = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setMessage("");

    setLoading(true);

    try {
      const response = await fetch("/api/vendor/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/vendor/login");
          return;
        }

        setError(
          data.error || "Unable to submit product."
        );

        return;
      }

      setMessage(
        "Product submitted successfully and is pending admin approval."
      );

      setForm({
        product_name: "",
        part_number: "",
        brand: "",
        category: "",
        description: "",
        price: "",
        currency: "USD",
        stock_status: "",
        lead_time: "",
      });
    } catch {
      setError(
        "Unable to submit product. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="vendor-product-page">
      <div className="vendor-product-shell">
        <div className="vendor-product-heading">
          <span>SPARESCO VENDOR PORTAL</span>

          <h1>Add Product</h1>

          <p>
            Submit a product for admin review. Approved
            products may later receive matching customer
            enquiries.
          </p>
        </div>

        <form
          className="vendor-product-card"
          onSubmit={submitProduct}
        >
          <div className="vendor-product-grid">
            <div className="vendor-product-field">
              <label>Product Name *</label>

              <input
                type="text"
                name="product_name"
                value={form.product_name}
                onChange={updateField}
                placeholder="Example: Hydraulic Filter"
                required
              />
            </div>

            <div className="vendor-product-field">
              <label>Part Number *</label>

              <input
                type="text"
                name="part_number"
                value={form.part_number}
                onChange={updateField}
                placeholder="Example: HC9600FKS13H"
                required
              />
            </div>

            <div className="vendor-product-field">
              <label>Brand *</label>

              <input
                type="text"
                name="brand"
                value={form.brand}
                onChange={updateField}
                placeholder="Example: Pall"
                required
              />
            </div>

            <div className="vendor-product-field">
              <label>Category *</label>

              <input
                type="text"
                name="category"
                value={form.category}
                onChange={updateField}
                placeholder="Example: Hydraulic Filters"
                required
              />
            </div>

            <div className="vendor-product-field">
              <label>Price</label>

              <input
                type="text"
                name="price"
                value={form.price}
                onChange={updateField}
                placeholder="Example: 125.00"
              />
            </div>

            <div className="vendor-product-field">
              <label>Currency</label>

              <select
                name="currency"
                value={form.currency}
                onChange={updateField}
              >
                <option value="USD">USD</option>
                <option value="INR">INR</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="AED">AED</option>
              </select>
            </div>

            <div className="vendor-product-field">
              <label>Stock Status</label>

              <select
                name="stock_status"
                value={form.stock_status}
                onChange={updateField}
              >
                <option value="">Select</option>
                <option value="in_stock">In Stock</option>
                <option value="limited_stock">
                  Limited Stock
                </option>
                <option value="out_of_stock">
                  Out of Stock
                </option>
                <option value="on_request">
                  Available on Request
                </option>
              </select>
            </div>

            <div className="vendor-product-field">
              <label>Lead Time</label>

              <input
                type="text"
                name="lead_time"
                value={form.lead_time}
                onChange={updateField}
                placeholder="Example: 7-10 days"
              />
            </div>
          </div>

          <div className="vendor-product-field vendor-product-description">
            <label>Description</label>

            <textarea
              name="description"
              value={form.description}
              onChange={updateField}
              rows={6}
              placeholder="Add product details, specifications or other useful information..."
            />
          </div>

          {message && (
            <div className="vendor-product-success">
              {message}
            </div>
          )}

          {error && (
            <div className="vendor-product-error">
              {error}
            </div>
          )}

          <div className="vendor-product-actions">
            <button
              type="button"
              className="vendor-product-secondary"
              onClick={() =>
                router.push("/vendor/dashboard")
              }
            >
              Back to Dashboard
            </button>

            <button
              type="submit"
              className="vendor-product-primary"
              disabled={loading}
            >
              {loading
                ? "Submitting..."
                : "Submit Product"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}