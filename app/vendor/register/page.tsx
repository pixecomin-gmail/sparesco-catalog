"use client";

import { useState } from "react";
import "./vendor-register.css";

export default function VendorRegisterPage() {
  const [form, setForm] = useState({
    company_name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    gst_number: "",
    website: "",
  });

  function updateField(name: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();

    try {
        const response = await fetch("/api/vendor/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
        });

        const data = await response.json();

        if (!response.ok) {
        alert(data.error || "Unable to submit vendor application.");
        return;
        }

        alert(
        "Vendor application submitted successfully. Your application is pending admin approval."
        );

        setForm({
        company_name: "",
        contact_person: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        country: "",
        gst_number: "",
        website: "",
        });
    } catch (error) {
        console.error("Vendor registration error:", error);
        alert("Something went wrong. Please try again.");
    }
    }

  return (
    <main className="vendor-register-page">
      <div className="vendor-register-container">
        <div className="vendor-register-header">
          <span className="vendor-register-tag">Become a Sparesco Vendor</span>

          <h1>Register your company</h1>

          <p>
            Submit your company details for approval. Once approved, you will be
            able to add your first 10 products.
          </p>
        </div>

        <form className="vendor-register-form" onSubmit={submitForm}>
          <div className="vendor-form-grid">
            <div className="vendor-field">
              <label>Company Name *</label>
              <input
                type="text"
                value={form.company_name}
                onChange={(e) =>
                  updateField("company_name", e.target.value)
                }
                required
              />
            </div>

            <div className="vendor-field">
              <label>Contact Person *</label>
              <input
                type="text"
                value={form.contact_person}
                onChange={(e) =>
                  updateField("contact_person", e.target.value)
                }
                required
              />
            </div>

            <div className="vendor-field">
              <label>Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
              />
            </div>

            <div className="vendor-field">
              <label>Contact Number *</label>
                <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                required
                />
            </div>

            <div className="vendor-field vendor-field-full">
              <label>Address</label>
              <textarea
                rows={3}
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
              />
            </div>

            <div className="vendor-field">
              <label>City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
              />
            </div>

            <div className="vendor-field">
              <label>State</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => updateField("state", e.target.value)}
              />
            </div>

            <div className="vendor-field">
              <label>Country</label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => updateField("country", e.target.value)}
              />
            </div>

            <div className="vendor-field">
              <label>GST / Tax Number *</label>
                <input
                type="text"
                value={form.gst_number}
                onChange={(e) => updateField("gst_number", e.target.value)}
                required
                />
            </div>

            <div className="vendor-field vendor-field-full">
              <label>Website</label>
              <input
                type="url"
                placeholder="https://example.com"
                value={form.website}
                onChange={(e) => updateField("website", e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="vendor-submit-button">
            Submit Vendor Application
          </button>
        </form>
      </div>
    </main>
  );
}