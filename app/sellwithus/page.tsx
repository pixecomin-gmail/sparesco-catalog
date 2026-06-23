"use client";

import { useState } from "react";
import Link from "next/link";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "../contact/contact.css";
import "./sellwithus.css";

export default function BecomeSupplierPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    message: "",
  });

  const [phone, setPhone] = useState<string | undefined>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function updateField(name: string, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) newErrors.name = "Name is required.";
    if (!form.email.trim()) newErrors.email = "Email is required.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = "Enter a valid email.";
    }
    if (!phone) newErrors.phone = "Phone number is required.";
    if (phone && !isValidPhoneNumber(phone)) {
      newErrors.phone = "Enter a valid phone number.";
    }
    if (!form.role) newErrors.role = "Please select buyer or seller.";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/website-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formType: "supplier",
          name: form.name,
          email: form.email,
          phone,
          role: form.role,
          message: form.message,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to submit supplier application.");
      }

      setSuccessMessage(
        "Supplier registration submitted successfully. Our team will contact you soon."
      );
      setErrorMessage("");

      setForm({
        name: "",
        email: "",
        role: "",
        message: "",
      });

      setPhone("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit supplier application."
      );
      setSuccessMessage("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="supplier-page">
      <section className="supplier-hero">
        <div className="container">
          <nav className="breadcrumb">
            <Link href="/">Home</Link> / <span>Become a Supplier</span>
          </nav>

          <span className="tagline">Sell With Us</span>

          <h1>Sell your spare parts to buyers worldwide.</h1>

          <p>
            Join Sparesco&apos;s supplier network and reach equipment owners,
            dealers, service teams and industrial buyers looking for spare parts
            and components.
          </p>

          <div className="button-row">
            <a href="#supplier-form">Start Selling Today</a>
            <a href="#how-it-works" className="secondary">
              How It Works
            </a>
          </div>
        </div>
      </section>

      <section className="supplier-stats">
        <div className="container supplier-stats-grid">
          <div>
            <strong>100,000+</strong>
            <span>Monthly Buyers</span>
          </div>
          <div>
            <strong>200+</strong>
            <span>Vendor Partners</span>
          </div>
          <div>
            <strong>50+</strong>
            <span>Countries Reached</span>
          </div>
          <div>
            <strong>₹0</strong>
            <span>Listing Fees</span>
          </div>
        </div>
      </section>

      <section className="sell-benefits">
        <div className="container sell-benefits-layout">
          <div className="sell-benefits-copy">
            <span className="tagline">Why Sell With Us?</span>
            <h2>Everything you need to grow your spare parts business.</h2>
            <p>
              Sparesco helps suppliers reach serious buyers, list products
              faster and manage enquiries without building their own marketplace.
            </p>
          </div>

          <div className="sell-benefits-list">
            <div>
              <strong>Quick Product Listing</strong>
              <p>
                Upload your inventory via Excel or API. Our team formats and
                publishes your listings.
              </p>
            </div>

            <div>
              <strong>Qualified Buyers</strong>
              <p>Buyers search by part number, equipment type and brand.</p>
            </div>

            <div>
              <strong>Location Exclusivity</strong>
              <p>
                Optional region-based listing protection for selected suppliers.
              </p>
            </div>

            <div>
              <strong>Monthly Reports</strong>
              <p>Track views, enquiries and performance insights.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="supplier-process-section" id="how-it-works">
        <div className="container">
          <div className="about-section-heading">
            <h2>What Happens After You Register?</h2>
            <p>Four simple steps to start selling.</p>
          </div>

          <div className="supplier-process-grid">
            <div className="supplier-process-card">
              <span>01</span>
              <h3>Register</h3>
              <p>
                Fill out the application form below. You&apos;ll receive a
                confirmation email with next steps within minutes.
              </p>
            </div>

            <div className="supplier-process-card">
              <span>02</span>
              <h3>Get Approved</h3>
              <p>
                Our team reviews your business details, inventory and pricing.
                Approval typically takes 1–2 business days.
              </p>
            </div>

            <div className="supplier-process-card">
              <span>03</span>
              <h3>List Products</h3>
              <p>
                Upload your inventory via spreadsheet or API. We format,
                categorize and publish everything for you.
              </p>
            </div>

            <div className="supplier-process-card">
              <span>04</span>
              <h3>Receive Leads</h3>
              <p>
                Start receiving qualified buyer enquiries. Respond, quote and
                close deals.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="supplier-types-strip">
        <div className="container supplier-types-inner">
          <div className="supplier-types-content">
            <span className="tagline">Who Can Sell?</span>
            <h2>Verified businesses across the industrial supply chain.</h2>
            <p>
              We work with manufacturers, distributors, service providers and
              equipment owners supplying spare parts and industrial components.
            </p>
          </div>

          <div className="supplier-types-list">
            <span>Dealers</span>
            <span>Manufacturers</span>
            <span>Distributors</span>
            <span>Importers</span>
            <span>Wholesalers</span>
            <span>Service Centers</span>
            <span>Equipment Owners</span>
            <span>Aftermarket Brands</span>
            <span>OEM Suppliers</span>
          </div>
        </div>
      </section>

      <section className="supplier-form-section" id="supplier-form">
        <div className="container">
          <div className="about-section-heading">
            <h2>Supplier Registration</h2>
            <p>
              Submit your details and our vendor partnerships team will contact
              you.
            </p>
          </div>

          <form className="supplier-form" onSubmit={submitForm}>
            <div className="supplier-form-grid">
              <label>
                <input
                  type="text"
                  placeholder="Name*"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                />
                {errors.name && <small>{errors.name}</small>}
              </label>

              <label>
                <input
                  type="email"
                  placeholder="Email*"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
                {errors.email && <small>{errors.email}</small>}
              </label>

              <label className="contact-phone-field">
                <PhoneInput
                  international
                  defaultCountry="IN"
                  value={phone}
                  onChange={(value) => {
                    setPhone(value);
                    setErrors((prev) => ({ ...prev, phone: "" }));
                  }}
                  placeholder="Phone number*"
                  className="contact-phone-input"
                />
                {errors.phone && <small>{errors.phone}</small>}
              </label>
            </div>

            <div className="supplier-role">
              <span>I am a*</span>

              <label>
                <input
                  type="radio"
                  name="role"
                  value="Buyer"
                  checked={form.role === "Buyer"}
                  onChange={(e) => updateField("role", e.target.value)}
                />
                Buyer
              </label>

              <label>
                <input
                  type="radio"
                  name="role"
                  value="Seller"
                  checked={form.role === "Seller"}
                  onChange={(e) => updateField("role", e.target.value)}
                />
                Seller
              </label>

              {errors.role && <small>{errors.role}</small>}
            </div>

            <textarea
              placeholder="Message"
              value={form.message}
              onChange={(e) => updateField("message", e.target.value)}
            />

            {successMessage ? (
              <p className="form-success-message">{successMessage}</p>
            ) : null}

            {errorMessage ? (
              <p className="form-error-message">{errorMessage}</p>
            ) : null}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}