"use client";

import { useState } from "react";
import Link from "next/link";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "./vendor-register.css";

type VendorForm = {
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  gst_number: string;
  country: string;
  address: string;
  city: string;
  state: string;
  website: string;
};

const emptyForm: VendorForm = {
  company_name: "",
  contact_person: "",
  email: "",
  phone: "",
  gst_number: "",
  country: "",
  address: "",
  city: "",
  state: "",
  website: "",
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isIndia(value: string) {
  return value.trim().toLowerCase() === "india";
}

function isValidIndianGst(value: string) {
  const gst = value.trim().toUpperCase();

  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gst);
}

export default function VendorRegisterPage() {
  const [form, setForm] = useState<VendorForm>(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(name: keyof VendorForm, value: string) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
  }

  function validateForm() {
    if (!form.company_name.trim()) {
      return "Company Name is required.";
    }

    if (!form.contact_person.trim()) {
      return "Contact Person is required.";
    }

    if (!form.email.trim()) {
      return "Email is required.";
    }

    if (!isValidEmail(form.email)) {
      return "Please enter a valid email address.";
    }

    if (!form.phone.trim()) {
      return "Contact Number is required.";
    }

    if (!isValidPhoneNumber(form.phone)) {
      return "Please enter a valid contact number.";
    }

    if (!form.gst_number.trim()) {
      return "GST / Tax Number is required.";
    }

    if (isIndia(form.country) && !isValidIndianGst(form.gst_number)) {
      return "Please enter a valid 15-character Indian GSTIN.";
    }

    if (
      form.website.trim() &&
      !/^https?:\/\/.+/i.test(form.website.trim())
    ) {
      return "Website must begin with http:// or https://";
    }

    return "";
  }

  async function submitForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/vendor/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          company_name: form.company_name.trim(),
          contact_person: form.contact_person.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          gst_number: form.gst_number.trim().toUpperCase(),
          country: form.country.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          website: form.website.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error || "Unable to submit vendor application."
        );
        return;
      }

      if (data.approvalRequired) {
        setSuccess(
          "Vendor registration submitted successfully. Your application is pending admin approval."
        );

        setForm(emptyForm);
        return;
      }

      window.location.href = "/vendor/login";
    } catch (error) {
      console.error("Vendor registration error:", error);

      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="vendor-register-page">
      <div className="vendor-register-container">
        <header className="vendor-register-header">
          <span className="vendor-register-tag">
            Become a Sparesco Vendor
          </span>

          <div className="vendor-register-heading-row">
            <div>
              <h1>Register your company</h1>

              <p>
                Register your company to access the Sparesco Vendor Portal
                and start adding your products.
              </p>
            </div>

            <div className="vendor-register-login">
              <span>Already registered?</span>

              <Link href="/vendor/login">
                Log in to Vendor Portal
              </Link>
            </div>
          </div>
        </header>

        <form
          className="vendor-register-form"
          onSubmit={submitForm}
          noValidate
        >
          <div className="vendor-form-grid">
            <div className="vendor-field">
              <label htmlFor="vendor-company">
                Company Name <span>*</span>
              </label>

              <input
                id="vendor-company"
                type="text"
                value={form.company_name}
                onChange={(e) =>
                  updateField("company_name", e.target.value)
                }
                autoComplete="organization"
                required
              />
            </div>

            <div className="vendor-field">
              <label htmlFor="vendor-contact">
                Contact Person <span>*</span>
              </label>

              <input
                id="vendor-contact"
                type="text"
                value={form.contact_person}
                onChange={(e) =>
                  updateField("contact_person", e.target.value)
                }
                autoComplete="name"
                required
              />
            </div>

            <div className="vendor-field">
              <label htmlFor="vendor-email">
                Email <span>*</span>
              </label>

              <input
                id="vendor-email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  updateField("email", e.target.value)
                }
                placeholder="name@company.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="vendor-field vendor-phone-field">
              <label>
                Contact Number <span>*</span>
              </label>

              <PhoneInput
                international
                defaultCountry="IN"
                value={form.phone || undefined}
                onChange={(value) =>
                  updateField("phone", value || "")
                }
                placeholder="Phone number"
                className="vendor-phone-input"
              />

              <small>Select the country code and enter the contact number.</small>
            </div>

            <div className="vendor-field">
              <label htmlFor="vendor-gst">
                GST / Tax Number <span>*</span>
              </label>

              <input
                id="vendor-gst"
                type="text"
                value={form.gst_number}
                onChange={(e) =>
                  updateField("gst_number", e.target.value)
                }
                placeholder={
                  isIndia(form.country)
                    ? "15-character GSTIN"
                    : "GST / VAT / Tax Number"
                }
                autoCapitalize="characters"
                required
              />

              {isIndia(form.country) && (
                <small>Indian GSTIN format will be validated.</small>
              )}
            </div>

            <div className="vendor-field">
              <label htmlFor="vendor-country">
                Country
              </label>

              <input
                id="vendor-country"
                type="text"
                value={form.country}
                onChange={(e) =>
                  updateField("country", e.target.value)
                }
                placeholder="India"
                autoComplete="country-name"
              />
            </div>

            <div className="vendor-field">
              <label htmlFor="vendor-address">
                Address
              </label>

              <input
                id="vendor-address"
                type="text"
                value={form.address}
                onChange={(e) =>
                  updateField("address", e.target.value)
                }
                autoComplete="street-address"
              />
            </div>

            <div className="vendor-field">
              <label htmlFor="vendor-city">
                City
              </label>

              <input
                id="vendor-city"
                type="text"
                value={form.city}
                onChange={(e) =>
                  updateField("city", e.target.value)
                }
                autoComplete="address-level2"
              />
            </div>

            <div className="vendor-field">
              <label htmlFor="vendor-state">
                State
              </label>

              <input
                id="vendor-state"
                type="text"
                value={form.state}
                onChange={(e) =>
                  updateField("state", e.target.value)
                }
                autoComplete="address-level1"
              />
            </div>

            <div className="vendor-field">
              <label htmlFor="vendor-website">
                Website
              </label>

              <input
                id="vendor-website"
                type="url"
                placeholder="https://example.com"
                value={form.website}
                onChange={(e) =>
                  updateField("website", e.target.value)
                }
                autoComplete="url"
              />
            </div>
          </div>

          {error && (
            <div className="vendor-form-message vendor-form-error">
              {error}
            </div>
          )}

          {success && (
            <div className="vendor-form-message vendor-form-success">
              {success}
            </div>
          )}

          <div className="vendor-form-footer">
            <p>
              Fields marked <strong>*</strong> are required.
            </p>

            <button
              type="submit"
              className="vendor-submit-button"
              disabled={submitting}
            >
              {submitting
                ? "Submitting..."
                : "Submit Vendor Application"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}