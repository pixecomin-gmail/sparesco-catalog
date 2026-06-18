"use client";

import { useState } from "react";
import Link from "next/link";
import "./spareshunt.css";

export default function SparesHuntPage() {
  const [step, setStep] = useState(1);

  return (
    <main className="hunt-page">
      <section className="hunt-hero">
        <div className="container">
          <span className="tagline">Spares Hunt</span>

          <h1>Can&apos;t find the spare part you need?</h1>

          <p>
            Share your part number, machine model or technical requirement and
            our sourcing team will help identify suitable OEM and aftermarket
            spare parts through our global supplier network.
          </p>

          <div className="button-row">
            <a href="#request-form">Submit Request</a>
            <Link href="/parts" className="secondary">
              Browse Parts
            </Link>
          </div>
        </div>
      </section>

      <section className="hunt-request-section" id="request-form">
        <div className="container hunt-request-layout">
          <aside className="hunt-sidebar">
            <div className="hunt-side-card">
              <h2>How It Works</h2>

              <div className="hunt-side-steps">
                <div>
                  <span>1</span>
                  <p>
                    <strong>Submit Request</strong>
                    <small>Share your part and machine details.</small>
                  </p>
                </div>

                <div>
                  <span>2</span>
                  <p>
                    <strong>Vendor Match</strong>
                    <small>We share it with verified suppliers.</small>
                  </p>
                </div>

                <div>
                  <span>3</span>
                  <p>
                    <strong>Receive Quotes</strong>
                    <small>Compare pricing and delivery options.</small>
                  </p>
                </div>

                <div>
                  <span>4</span>
                  <p>
                    <strong>Order Direct</strong>
                    <small>Choose a supplier and complete the order.</small>
                  </p>
                </div>
              </div>
            </div>

            <div className="hunt-side-card">
              <h2>Buyer Protection</h2>

              <ul className="hunt-protection-list">
                <li>Verified suppliers only</li>
                <li>Wrong part support</li>
                <li>Secure transactions</li>
              </ul>
            </div>
          </aside>

          <form className="hunt-request-card">
            <div className="hunt-progress">
              <button
                type="button"
                className={step === 1 ? "active" : ""}
                onClick={() => setStep(1)}
              >
                <span>1</span>
                Machine Info
              </button>

              <button
                type="button"
                className={step === 2 ? "active" : ""}
                onClick={() => setStep(2)}
              >
                <span>2</span>
                Part Details
              </button>

              <button
                type="button"
                className={step === 3 ? "active" : ""}
                onClick={() => setStep(3)}
              >
                <span>3</span>
                Contact
              </button>
            </div>

            <div className="hunt-form-area">
              {step === 1 && (
                <div className="hunt-panel">
                  <h2>Machine Information</h2>
                  <p>Tell us about the equipment that needs the part.</p>

                  <div className="hunt-form-grid">
                    <select>
                      <option value="">Machine Category*</option>
                      <option>Excavator</option>
                      <option>Wheel Loader</option>
                      <option>Bulldozer</option>
                      <option>Crane</option>
                      <option>Motor Grader</option>
                      <option>Backhoe Loader</option>
                      <option>Forklift</option>
                      <option>Generator</option>
                      <option>Other</option>
                    </select>

                    <input placeholder="Machine Make" />
                    <input placeholder="Machine Model" />
                    <input placeholder="Year" />
                    <input placeholder="Serial Number" />
                    <input placeholder="Country" />

                    <textarea
                      className="hunt-full-field"
                      placeholder="Additional Machine Details"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="hunt-panel">
                  <h2>Part Details</h2>
                  <p>Share the part information you have available.</p>

                  <div className="hunt-form-grid">
                    <input placeholder="Part Number*" />
                    <input placeholder="Part Name" />
                    <input placeholder="Brand" />
                    <input placeholder="Quantity Required*" />
                  </div>

                  <div className="condition-row">
                    <span>Condition</span>

                    <label>
                      <input type="radio" name="condition" />
                      New OEM
                    </label>

                    <label>
                      <input type="radio" name="condition" />
                      New Aftermarket
                    </label>

                    <label>
                      <input type="radio" name="condition" />
                      Used
                    </label>
                  </div>

                  <div className="hunt-two-box">
                    <textarea placeholder="Description" />

                    <div className="upload-placeholder">Upload Photo</div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="hunt-panel">
                  <h2>Contact Details</h2>
                  <p>Tell us where to send sourcing updates.</p>

                  <div className="hunt-form-grid">
                    <input placeholder="Name*" />
                    <input placeholder="Company" />

                    <select>
                      <option>India +91</option>
                      <option>United States +1</option>
                      <option>United Kingdom +44</option>
                      <option>UAE +971</option>
                      <option>Saudi Arabia +966</option>
                    </select>

                    <input placeholder="Phone No*" />

                    <input placeholder="Email*" />
                    <input placeholder="Country" />
                  </div>

                  <textarea placeholder="Additional Notes" />
                </div>
              )}
            </div>

            <div className="hunt-form-actions">
              <button
                type="button"
                className="secondary"
                disabled={step === 1}
                onClick={() => setStep(step - 1)}
              >
                Back
              </button>

              {step < 3 ? (
                <button type="button" onClick={() => setStep(step + 1)}>
                  Next Step
                </button>
              ) : (
                <button type="button" onClick={() => alert("Request submitted.")}>
                  Submit Request
                </button>
              )}
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}