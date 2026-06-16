"use client";

import { useEnquiry } from "@/context/EnquiryContext";

export default function EnquiryPage() {
  const { items, increaseQty, decreaseQty, removeItem } = useEnquiry();

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

              {items.map((item) => (
                <div className="enquiry-item" key={item.handle}>
                  <div>
                    <strong>{item.title}</strong>
                    <span>
                      {item.brand} • {item.category}
                    </span>
                  </div>

                  <div className="qty-control">
                    <button
                      type="button"
                      onClick={() => decreaseQty(item.handle)}
                    >
                      -
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      type="button"
                      onClick={() => increaseQty(item.handle)}
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => removeItem(item.handle)}
                  >
                    Remove
                  </button>
                </div>
              ))}
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