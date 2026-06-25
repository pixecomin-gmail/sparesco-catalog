"use client";

import { useState } from "react";

type Props = {
  onRequestQuote: () => void;
};

const faqs = [
  {
    question: "Is this part genuine or aftermarket?",
    answer:
      "We supply both genuine OEM and high-quality aftermarket spare parts. If you require a specific option, please mention it in your enquiry so our team can confirm availability.",
  },
  {
    question: "How do I confirm compatibility?",
    answer:
      "Compatibility depends on your equipment model, serial number and existing part number. Share these details with your enquiry and our team will help identify the correct replacement before you order.",
  },
  {
    question: "Can you source discontinued or hard-to-find parts?",
    answer:
      "Yes. Through our global supplier network, we can source many obsolete, discontinued and difficult-to-find spare parts.",
  },
  {
    question: "How quickly will I receive a quotation?",
    answer:
      "Most enquiries receive a response within one business day. Urgent requirements are prioritised whenever possible.",
  },
];

export default function ProductFaqTrustSection({ onRequestQuote }: Props) {
  const [activeFaq, setActiveFaq] = useState(0);

  return (
    <section className="faq-trust-section">
      <div className="faq-trust-grid container">
        <div>
          <div className="section-card">
            <h2>FAQ</h2>

            {faqs.map((faq, index) => (
              <div
                key={faq.question}
                className={
                  activeFaq === index ? "faq-item active" : "faq-item"
                }
              >
                <button
                  type="button"
                  className="faq-question"
                  onClick={() =>
                    setActiveFaq(activeFaq === index ? -1 : index)
                  }
                >
                  {faq.question}
                </button>

                <div className="faq-answer">
                  <div className="faq-answer-inner">{faq.answer}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="section-card shipping-card">
            <h2>Shipping & Delivery</h2>
            <p>
              We ship industrial spare parts worldwide through trusted logistics
              partners. Standard and express shipping options are available
              depending on product availability, order quantity and destination.
            </p>

            <div className="shipping-tags">
              <span className="tag">Air Freight</span>
              <span className="tag">Sea Freight</span>
              <span className="tag">Express</span>
              <span className="tag">International</span>
            </div>
          </div>
        </div>

        <div className="section-card">
          <h2>Why Choose Sparesco</h2>

          <div className="badge-grid">
            <div className="badge-item">
              <div className="badge-icon">✓</div>
              <div className="badge-text">
                <h4>Quality Guaranteed</h4>
                <p>All products meet or exceed OEM specifications</p>
              </div>
            </div>

            <div className="badge-item">
              <div className="badge-icon">↗</div>
              <div className="badge-text">
                <h4>OEM & Aftermarket Parts</h4>
                <p>Genuine and premium replacement options</p>
              </div>
            </div>

            <div className="badge-item">
              <div className="badge-icon">?</div>
              <div className="badge-text">
                <h4>Technical Identification</h4>
                <p>Support for matching correct parts</p>
              </div>
            </div>

            <div className="badge-item">
              <div className="badge-icon">◎</div>
              <div className="badge-text">
                <h4>Global Supplier Network</h4>
                <p>Trusted manufacturers and distributors</p>
              </div>
            </div>
          </div>

          <div className="support-cta">
            <h4>Need Assistance?</h4>
            <p>
             Our specialists can help identify compatible OEM and aftermarket replacement parts for your equipment.
            </p>

            <a href="/contact"
              className="btn-primary"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}