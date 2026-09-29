"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "../contact/contact.css";
import "./sellwithus.css";


export default function BecomeSupplierPage() {
  const formTopRef = useRef<HTMLDivElement>(null);
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

  const [vendorTab, setVendorTab] = useState<"register" | "login">(
    "register"
  );

  const [vendorForm, setVendorForm] = useState({
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
  });

  const [vendorError, setVendorError] = useState("");
  const [vendorSuccess, setVendorSuccess] = useState("");
  const [vendorSubmitting, setVendorSubmitting] = useState(false);
  const [vendorLoginEmail, setVendorLoginEmail] = useState("");
  const [vendorOtp, setVendorOtp] = useState("");
  const [vendorOtpSent, setVendorOtpSent] = useState(false);
  const [vendorLoginLoading, setVendorLoginLoading] = useState(false);
  const [vendorLoginMessage, setVendorLoginMessage] = useState("");
  const [vendorLoginError, setVendorLoginError] = useState("");

  function updateField(name: string, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

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
          name: form.name.trim(),
          email: form.email.trim(),
          phone,
          role: form.role,
          message: form.message.trim(),
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
      setErrors({});

      window.setTimeout(() => {
        formTopRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);

    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit supplier application."
      );
      setSuccessMessage("");
      window.setTimeout(() => {
        formTopRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateVendorField(name: string, value: string) {
    setVendorForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setVendorError("");
    setVendorSuccess("");
  }

  function isValidVendorEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  function isIndiaVendor(value: string) {
    return value.trim().toLowerCase() === "india";
  }

  function isValidIndianVendorGst(value: string) {
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(
      value.trim().toUpperCase()
    );
  }

  async function submitVendorRegistration(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setVendorError("");
    setVendorSuccess("");

    if (!vendorForm.company_name.trim()) {
      setVendorError("Company Name is required.");
      return;
    }

    if (!vendorForm.contact_person.trim()) {
      setVendorError("Contact Person is required.");
      return;
    }

    if (!vendorForm.email.trim()) {
      setVendorError("Email is required.");
      return;
    }

    if (!isValidVendorEmail(vendorForm.email)) {
      setVendorError("Please enter a valid email address.");
      return;
    }

    if (!vendorForm.phone.trim()) {
      setVendorError("Contact Number is required.");
      return;
    }

    if (!isValidPhoneNumber(vendorForm.phone)) {
      setVendorError("Please enter a valid contact number.");
      return;
    }

    if (!vendorForm.gst_number.trim()) {
      setVendorError("GST / Tax Number is required.");
      return;
    }

    if (
      isIndiaVendor(vendorForm.country) &&
      !isValidIndianVendorGst(vendorForm.gst_number)
    ) {
      setVendorError(
        "Please enter a valid 15-character Indian GSTIN."
      );
      return;
    }

    if (
      vendorForm.website.trim() &&
      !/^https?:\/\/.+/i.test(vendorForm.website.trim())
    ) {
      setVendorError(
        "Website must begin with http:// or https://"
      );
      return;
    }

    try {
      setVendorSubmitting(true);

      const response = await fetch("/api/vendor/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...vendorForm,
          company_name: vendorForm.company_name.trim(),
          contact_person: vendorForm.contact_person.trim(),
          email: vendorForm.email.trim().toLowerCase(),
          phone: vendorForm.phone.trim(),
          gst_number: vendorForm.gst_number.trim().toUpperCase(),
          country: vendorForm.country.trim(),
          address: vendorForm.address.trim(),
          city: vendorForm.city.trim(),
          state: vendorForm.state.trim(),
          website: vendorForm.website.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setVendorError(
          data.error || "Unable to submit vendor application."
        );
        return;
      }

      if (data.approvalRequired) {
        setVendorSuccess(
          "Thank you for registering with Sparesco. Your vendor account is currently pending approval. We will notify you once your account has been approved."
        );

        setVendorForm({
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
        });

        return;
      }

      setVendorTab("login");
    } catch (error) {
      console.error("Vendor registration error:", error);

      setVendorError(
        "Something went wrong. Please try again."
      );
    } finally {
      setVendorSubmitting(false);
    }
  }

  async function sendVendorOtp() {
    setVendorLoginError("");
    setVendorLoginMessage("");

    const cleanEmail = vendorLoginEmail.trim().toLowerCase();

    if (!cleanEmail) {
      setVendorLoginError(
        "Please enter your registered email."
      );
      return;
    }

    setVendorLoginLoading(true);

    try {
      const response = await fetch(
        "/api/vendor/login/request-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: cleanEmail,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setVendorLoginError(
          data.error || "Unable to send OTP."
        );
        return;
      }

      setVendorOtpSent(true);
      setVendorLoginMessage(
        "OTP sent to your registered email."
      );
    } catch {
      setVendorLoginError(
        "Unable to send OTP. Please try again."
      );
    } finally {
      setVendorLoginLoading(false);
    }
  }

  async function verifyVendorOtp() {
    setVendorLoginError("");
    setVendorLoginMessage("");

    if (!/^\d{6}$/.test(vendorOtp.trim())) {
      setVendorLoginError(
        "Please enter the 6-digit OTP."
      );
      return;
    }

    setVendorLoginLoading(true);

    try {
      const response = await fetch(
        "/api/vendor/login/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: vendorLoginEmail.trim().toLowerCase(),
            otp: vendorOtp.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setVendorLoginError(
          data.error || "Unable to verify OTP."
        );
        return;
      }

      window.location.href = "/vendor/dashboard";
    } catch {
      setVendorLoginError(
        "Unable to verify OTP. Please try again."
      );
    } finally {
      setVendorLoginLoading(false);
    }
  }

  return (
    <main className="supplier-page">
      <section className="supplier-hero">
        <div className="container">
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

      {/* <section className="supplier-form-section" id="supplier-form">
        <div className="container">
          <div className="about-section-heading">
            <h2>Supplier Registration</h2>
            <p>
              Submit your details and our vendor partnerships team will contact
              you.
            </p>
          </div>

          <div ref={formTopRef}>
            {successMessage ? (
              <div
                className="contact-form-notification contact-form-notification-success"
                role="status"
              >
                <strong>Form submitted</strong>
                <p>{successMessage}</p>
              </div>
            ) : null}

            {errorMessage ? (
              <div
                className="contact-form-notification contact-form-notification-error"
                role="alert"
              >
                <strong>Submission failed</strong>
                <p>{errorMessage}</p>
              </div>
            ) : null}

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

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </form>
        </div>
        </div>
      </section> */}

      <section className="supplier-form-section" id="supplier-form">
        <div className="container">
          <div className="about-section-heading">
            <h2>Vendor Account</h2>
            <p>
              Create a vendor account to start selling with Sparesco,
              or sign in if you are already registered.
            </p>
          </div>

          <div className="vendor-account-box">
            <div className="vendor-account-tabs">
              <button
                type="button"
                className={
                  vendorTab === "register"
                    ? "vendor-account-tab active"
                    : "vendor-account-tab"
                }
                onClick={() => setVendorTab("register")}
              >
                Create Account
              </button>

              <button
                type="button"
                className={
                  vendorTab === "login"
                    ? "vendor-account-tab active"
                    : "vendor-account-tab"
                }
                onClick={() => setVendorTab("login")}
              >
                Sign In
              </button>
            </div>

            <div className="vendor-account-content">
              {vendorTab === "register" ? (
                <form
                  className="supplier-form"
                  onSubmit={submitVendorRegistration}
                  noValidate
                >
                  <div className="supplier-form-grid">

                    <input
                      type="text"
                      placeholder="Company Name *"
                      value={vendorForm.company_name}
                      onChange={(e) =>
                        updateVendorField("company_name", e.target.value)
                      }
                    />

                    <input
                      type="text"
                      placeholder="Contact Person *"
                      value={vendorForm.contact_person}
                      onChange={(e) =>
                        updateVendorField("contact_person", e.target.value)
                      }
                    />

                    <input
                      type="email"
                      placeholder="Email Address *"
                      value={vendorForm.email}
                      onChange={(e) =>
                        updateVendorField("email", e.target.value)
                      }
                    />

                    <div className="vendor-tab-phone">
                      <PhoneInput
                        international
                        defaultCountry="IN"
                        value={vendorForm.phone || undefined}
                        onChange={(value) =>
                          updateVendorField("phone", value || "")
                        }
                        placeholder="Contact Number *"
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="GST / Tax Number *"
                      value={vendorForm.gst_number}
                      onChange={(e) =>
                        updateVendorField("gst_number", e.target.value)
                      }
                    />

                    <input
                      type="text"
                      placeholder="Country"
                      value={vendorForm.country}
                      onChange={(e) =>
                        updateVendorField("country", e.target.value)
                      }
                    />

                    <input
                      type="text"
                      placeholder="Address"
                      value={vendorForm.address}
                      onChange={(e) =>
                        updateVendorField("address", e.target.value)
                      }
                    />

                    <input
                      type="text"
                      placeholder="City"
                      value={vendorForm.city}
                      onChange={(e) =>
                        updateVendorField("city", e.target.value)
                      }
                    />

                    <input
                      type="text"
                      placeholder="State"
                      value={vendorForm.state}
                      onChange={(e) =>
                        updateVendorField("state", e.target.value)
                      }
                    />

                    <input
                      type="url"
                      placeholder="Website (https://...)"
                      value={vendorForm.website}
                      onChange={(e) =>
                        updateVendorField("website", e.target.value)
                      }
                    />

                  </div>

                  {vendorError && (
                    <div className="vendor-tab-message vendor-tab-error">
                      {vendorError}

                      {vendorError.includes("already exists") && (
                        <>
                          {" "}
                          <button
                            type="button"
                            className="vendor-error-login-link"
                            onClick={() => {
                              setVendorTab("login");
                              setVendorLoginEmail(
                                vendorForm.email.trim().toLowerCase()
                              );
                              setVendorError("");
                            }}
                          >
                            Sign in here
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {vendorSuccess && (
                    <div className="vendor-tab-message vendor-tab-success">
                      {vendorSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={vendorSubmitting}
                  >
                    {vendorSubmitting
                      ? "Submitting..."
                      : "Submit Vendor Application"}
                  </button>
                </form>
              ) : (
                <div className="vendor-tab-login">

                  <div className="vendor-tab-login-heading">
                    <h3>
                      {vendorOtpSent
                        ? "Enter your OTP"
                        : "Welcome back"}
                    </h3>

                    <p>
                      {vendorOtpSent
                        ? `We sent a 6-digit OTP to ${vendorLoginEmail}.`
                        : "Enter your registered email address to securely access your vendor account."}
                    </p>
                  </div>

                  <div className="vendor-tab-login-form">

                    <label htmlFor="vendor-login-email">
                      Registered Email
                    </label>

                    <input
                      id="vendor-login-email"
                      type="email"
                      value={vendorLoginEmail}
                      disabled={vendorOtpSent}
                      onChange={(e) =>
                        setVendorLoginEmail(e.target.value)
                      }
                      placeholder="name@company.com"
                      autoComplete="email"
                    />

                    {!vendorOtpSent && (
                      <button
                        type="button"
                        className="vendor-login-submit"
                        onClick={sendVendorOtp}
                        disabled={vendorLoginLoading}
                      >
                        {vendorLoginLoading
                          ? "Sending OTP..."
                          : "Send OTP"}
                      </button>
                    )}

                    {vendorOtpSent && (
                      <>
                        <label
                          htmlFor="vendor-login-otp"
                          className="vendor-otp-label"
                        >
                          6-Digit OTP
                        </label>

                        <input
                          id="vendor-login-otp"
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={vendorOtp}
                          onChange={(e) =>
                            setVendorOtp(
                              e.target.value.replace(/\D/g, "")
                            )
                          }
                          placeholder="000000"
                          autoComplete="one-time-code"
                          className="vendor-otp-input"
                        />

                        <button
                          type="button"
                          className="vendor-login-submit"
                          onClick={verifyVendorOtp}
                          disabled={vendorLoginLoading}
                        >
                          {vendorLoginLoading
                            ? "Verifying..."
                            : "Verify & Sign In"}
                        </button>

                        <div className="vendor-login-secondary-actions">
                          <button
                            type="button"
                            onClick={sendVendorOtp}
                            disabled={vendorLoginLoading}
                          >
                            Resend OTP
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setVendorOtpSent(false);
                              setVendorOtp("");
                              setVendorLoginMessage("");
                              setVendorLoginError("");
                            }}
                          >
                            Change Email
                          </button>
                        </div>
                      </>
                    )}

                    {vendorLoginMessage && (
                      <div className="vendor-tab-message vendor-tab-success">
                        {vendorLoginMessage}
                      </div>
                    )}

                    {vendorLoginError && (
                      <div className="vendor-tab-message vendor-tab-error">
                        {vendorLoginError}
                      </div>
                    )}

                  </div>

                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}