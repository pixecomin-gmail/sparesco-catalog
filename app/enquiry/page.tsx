"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useEnquiry } from "@/context/EnquiryContext";

export default function EnquiryPage() {
  const { items, increaseQty, decreaseQty, removeItem } = useEnquiry();
  const hasItems = items.length > 0;

  const [phone, setPhone] = useState<string | undefined>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const submitEnquiry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;

    setSuccessMessage("");
    setErrorMessage("");

    if (!hasItems) {
      setErrorMessage("Please add at least one product to enquiry.");
      return;
    }

    const formData = new FormData(form);

    const name = String(formData.get("name") || "").trim();
    const company = String(formData.get("company") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!name || !company || !email || !phone) {
      setErrorMessage("Please fill all required fields.");
      return;
    }

    if (!isValidPhoneNumber(phone)) {
      setErrorMessage("Please enter a valid phone number.");
      return;
    }

    const payload = {
      name,
      company,
      email,
      phone,
      message,
      items,
    };

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to submit enquiry.");
      }

      setSuccessMessage(
        "Enquiry submitted successfully. Our team will contact you soon."
      );

      form.reset();
      setPhone("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit enquiry. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main>
      <section className="section">
        <div className="container">
          <h1 className="page-title">Submit Enquiry</h1>

          <p className="page-intro">
            Review your selected products and share your details. Our team will
            contact you.
          </p>

          <div
            className={
              hasItems
                ? "enquiry-page-layout"
                : "enquiry-page-layout enquiry-page-layout-no-summary"
            }
          >
            {hasItems && (
              <div className="enquiry-summary">
                <h2>Products Summary</h2>

                <div className="enquiry-page-items">
                  {items.map((item) => (
                    <div
                      className="enquiry-item enquiry-item-compact"
                      key={item.id}
                    >
                      <Link
                        href={`/products/${item.handle}`}
                        className="enquiry-item-image"
                      >
                        {item.image ? (
                          <img src={item.image} alt={item.title} />
                        ) : null}
                      </Link>

                      <div className="enquiry-item-content">
                        <Link
                          href={`/products/${item.handle}`}
                          className="enquiry-item-title"
                        >
                          {item.title}
                        </Link>

                        <div className="enquiry-item-meta">
                          {item.vendor || "Variant"} |{" "}
                          {Number(item.price) > 0
                            ? `₹${Number(item.price).toLocaleString("en-IN")}`
                            : "Price on Request"}
                        </div>
                      </div>

                      <div className="qty-control">
                        <button
                          type="button"
                          onClick={() => decreaseQty(item.id)}
                        >
                          -
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          type="button"
                          onClick={() => increaseQty(item.id)}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className="delete-icon-button"
                        onClick={() => removeItem(item.id)}
                        aria-label="Remove item"
                      >
                        🗑
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form className="enquiry-form" onSubmit={submitEnquiry}>
              <div className="form-row">
                <label className="form-field">
                  Name *
                  <input name="name" placeholder="Your full name" />
                </label>

                <label className="form-field">
                  Email *
                  <input name="email" type="email" placeholder="Email address" />
                </label>
              </div>

              <div className="form-row">
                <label className="form-field">
                  Company *
                  <input name="company" placeholder="Company name" />
                </label>

                <label className="form-field">
                  Phone *
                  <PhoneInput
                    international
                    defaultCountry="IN"
                    value={phone}
                    onChange={setPhone}
                    placeholder="Phone number"
                    className="phone-input-row"
                  />
                </label>
              </div>

              <label className="form-field">
                Message
                <textarea name="message" placeholder="Additional message" />
              </label>

              {successMessage ? (
                <p className="form-success-message">{successMessage}</p>
              ) : null}

              {errorMessage ? (
                <p className="form-error-message">{errorMessage}</p>
              ) : null}

              <button
                type="submit"
                className="primary-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Enquiry"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}