"use client";

import Link from "next/link";
import { useEnquiry } from "@/context/EnquiryContext";

export default function EnquiryPage() {
  const { items, increaseQty, decreaseQty, removeItem, closeDrawer } =
    useEnquiry();

  return (
    <main>
      <section className="section">
        <div className="container">
          <h1 className="page-title">Submit Enquiry</h1>

          <p className="page-intro">
            Review your selected products and share your details. Our team will
            contact you.
          </p>

          <div className="enquiry-page-layout">
            <div className="enquiry-summary">
              <h2>Products Summary</h2>

              {items.length === 0 && (
                <p className="empty-message">No products added yet.</p>
              )}

              <div className="enquiry-page-items">
                {items.map((item) => (
                  <div className="enquiry-item enquiry-item-compact" key={item.id}>
                    <Link
                      href={`/products/${item.handle}`}
                      className="enquiry-item-image"
                    >
                      {item.image ? <img src={item.image} alt={item.title} /> : null}
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
                      <button type="button" onClick={() => decreaseQty(item.id)}>
                        -
                      </button>

                      <span>{item.quantity}</span>

                      <button type="button" onClick={() => increaseQty(item.id)}>
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

            <form className="enquiry-form">
              <label className="form-field">
                Name *
                <input placeholder="Your full name" />
              </label>

              <label className="form-field">
                Company *
                <input placeholder="Company name" />
              </label>

              <label className="form-field">
                Email *
                <input placeholder="Email address" />
              </label>

              <label className="form-field">
                Phone *
                <input placeholder="Phone number" />
              </label>

              <label className="form-field">
                Message
                <textarea placeholder="Additional message" />
              </label>

              <button type="submit" className="primary-button">
                Submit Enquiry
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}