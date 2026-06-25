"use client";

import { useState } from "react";
import Link from "next/link";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "./contact.css";

export default function ContactPage() {
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
          formType: "contact",
          name: form.name,
          email: form.email,
          phone,
          role: form.role,
          message: form.message,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to submit enquiry.");
      }

      setSuccessMessage(
        "Enquiry submitted successfully. Our team will contact you soon."
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
          : "Unable to submit enquiry."
      );

      setSuccessMessage("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="contact-page">
      <div className="contact-wrap">
        <nav className="contact-breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>Contact Us</span>
        </nav>

        <header className="contact-header">
          <h1>Contact Us</h1>
          <p>
            Need help sourcing spare parts, vendor partnerships, product
            availability or catalogue enquiries? Send us your details and our
            team will get back to you.
          </p>
        </header>

        <section className="contact-layout">
          <aside className="contact-info">
            <div className="contact-info-item">
              <span>Phone</span>
              <strong>+91 124 456 7890</strong>
              <p>Mon–Sat, 9:00 AM – 6:00 PM IST</p>
            </div>

            <div className="contact-info-item">
              <span>Sales &amp; Sourcing</span>
              <strong>sales@sparesco.com</strong>
              <p>For parts enquiry and procurement support</p>
            </div>

            <div className="contact-info-item">
              <span>Vendor Partnerships</span>
              <strong>vendors@sparesco.com</strong>
              <p>For suppliers, distributors and catalogue onboarding</p>
            </div>
          </aside>

          <form className="contact-form" onSubmit={submitForm}>
            <div className="contact-grid">
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

            <div className="contact-role">
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
        </section>
      </div>
    </main>
  );
}