"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "./spareshunt.css";

export default function SparesHuntPage() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState<string | undefined>("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [condition, setCondition] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [formValues, setFormValues] = useState({
    machineCategory: "",
    machineMake: "",
    machineModel: "",
    year: "",
    serialNumber: "",
    machineCountry: "",
    machineDetails: "",
    partNumber: "",
    partName: "",
    brand: "",
    quantityRequired: "",
    description: "",
    name: "",
    company: "",
    email: "",
    location: "",
    notes: "",
  });

  const updateField = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormValues({
      ...formValues,
      [event.target.name]: event.target.value,
    });
  };

  const goNext = () => {
    setSuccessMessage("");
    setErrorMessage("");

    if (step === 1 && !formValues.machineCategory.trim()) {
      setErrorMessage("Machine category is required.");
      return;
    }

    if (step === 2 && !formValues.partNumber.trim()) {
      setErrorMessage("Part number is required.");
      return;
    }

    if (step === 2 && !formValues.quantityRequired.trim()) {
      setErrorMessage("Quantity required is required.");
      return;
    }

    setStep(step + 1);
  };

  const submitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    if (!formValues.machineCategory.trim()) {
      setErrorMessage("Machine category is required.");
      setStep(1);
      return;
    }

    if (!formValues.partNumber.trim()) {
      setErrorMessage("Part number is required.");
      setStep(2);
      return;
    }

    if (!formValues.quantityRequired.trim()) {
      setErrorMessage("Quantity required is required.");
      setStep(2);
      return;
    }

    if (!formValues.name.trim()) {
      setErrorMessage("Name is required.");
      setStep(3);
      return;
    }

    if (!phone) {
      setErrorMessage("Phone number is required.");
      setStep(3);
      return;
    }

    if (!isValidPhoneNumber(phone)) {
      setErrorMessage("Please enter a valid phone number.");
      setStep(3);
      return;
    }

    if (!formValues.email.trim()) {
      setErrorMessage("Email is required.");
      setStep(3);
      return;
    }

    if (photo && photo.size > 2 * 1024 * 1024) {
      setErrorMessage("Photo size must be less than 2MB.");
      setStep(2);
      return;
    }

    const formData = new FormData();

    Object.entries(formValues).forEach(([key, value]) => {
      formData.set(key, value);
    });

    formData.set("phone", phone);
    formData.set("condition", condition);

    if (photo) {
      formData.set("photo", photo);
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/spareshunt", {
        method: "POST",
        body: formData,
      });

      const text = await response.text();

      let result;

      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(text.slice(0, 200));
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to submit request.");
      }

      setSuccessMessage(
        "Request submitted successfully. Our team will contact you soon."
      );

      setFormValues({
        machineCategory: "",
        machineMake: "",
        machineModel: "",
        year: "",
        serialNumber: "",
        machineCountry: "",
        machineDetails: "",
        partNumber: "",
        partName: "",
        brand: "",
        quantityRequired: "",
        description: "",
        name: "",
        company: "",
        email: "",
        location: "",
        notes: "",
      });

      setPhone("");
      setPhoto(null);
      setCondition("");
      setStep(1);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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

          <form className="hunt-request-card" onSubmit={submitRequest}>
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
                    <input
                      name="machineCategory"
                      placeholder="Machine Category*"
                      value={formValues.machineCategory}
                      onChange={updateField}
                    />

                    <input
                      name="machineMake"
                      placeholder="Machine Make"
                      value={formValues.machineMake}
                      onChange={updateField}
                    />

                    <input
                      name="machineModel"
                      placeholder="Machine Model"
                      value={formValues.machineModel}
                      onChange={updateField}
                    />

                    <input
                      name="year"
                      placeholder="Year"
                      value={formValues.year}
                      onChange={updateField}
                    />

                    <input
                      name="serialNumber"
                      placeholder="Serial Number"
                      value={formValues.serialNumber}
                      onChange={updateField}
                    />

                    <input
                      name="machineCountry"
                      placeholder="Country"
                      value={formValues.machineCountry}
                      onChange={updateField}
                    />

                    <textarea
                      name="machineDetails"
                      className="hunt-full-field"
                      placeholder="Additional Machine Details"
                      value={formValues.machineDetails}
                      onChange={updateField}
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="hunt-panel">
                  <h2>Part Details</h2>
                  <p>Share the part information you have available.</p>

                  <div className="hunt-form-grid">
                    <input
                      name="partNumber"
                      placeholder="Part Number*"
                      value={formValues.partNumber}
                      onChange={updateField}
                    />

                    <input
                      name="partName"
                      placeholder="Part Name"
                      value={formValues.partName}
                      onChange={updateField}
                    />

                    <input
                      name="brand"
                      placeholder="Brand"
                      value={formValues.brand}
                      onChange={updateField}
                    />

                    <input
                      name="quantityRequired"
                      placeholder="Quantity Required*"
                      value={formValues.quantityRequired}
                      onChange={updateField}
                    />
                  </div>

                  <div className="condition-row">
                    <span>Condition</span>

                    <label>
                      <input
                        type="radio"
                        name="conditionRadio"
                        checked={condition === "New OEM"}
                        onChange={() => setCondition("New OEM")}
                      />
                      New OEM
                    </label>

                    <label>
                      <input
                        type="radio"
                        name="conditionRadio"
                        checked={condition === "New Aftermarket"}
                        onChange={() => setCondition("New Aftermarket")}
                      />
                      New Aftermarket
                    </label>

                    <label>
                      <input
                        type="radio"
                        name="conditionRadio"
                        checked={condition === "Used"}
                        onChange={() => setCondition("Used")}
                      />
                      Used
                    </label>
                  </div>

                  <div className="hunt-two-box">
                    <textarea
                      name="description"
                      placeholder="Description"
                      value={formValues.description}
                      onChange={updateField}
                    />

                    <label className="upload-placeholder">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const selectedFile = event.target.files?.[0] || null;

                          if (
                            selectedFile &&
                            selectedFile.size > 2 * 1024 * 1024
                          ) {
                            setErrorMessage("Photo size must be less than 2MB.");
                            event.target.value = "";
                            setPhoto(null);
                            return;
                          }

                          setErrorMessage("");
                          setPhoto(selectedFile);
                        }}
                      />
                      <span>{photo ? photo.name : "Upload Photo Max 2MB"}</span>
                    </label>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="hunt-panel">
                  <h2>Contact Details</h2>
                  <p>Tell us where to send sourcing updates.</p>

                  <div className="hunt-form-grid">
                    <input
                      name="name"
                      placeholder="Name*"
                      value={formValues.name}
                      onChange={updateField}
                    />

                    <input
                      name="company"
                      placeholder="Company"
                      value={formValues.company}
                      onChange={updateField}
                    />

                    <PhoneInput
                      international
                      defaultCountry="IN"
                      value={phone}
                      onChange={setPhone}
                      placeholder="Phone number*"
                      className="hunt-phone-input hunt-full-field"
                    />

                    <input
                      name="email"
                      type="email"
                      placeholder="Email*"
                      value={formValues.email}
                      onChange={updateField}
                    />

                    <input
                      name="location"
                      placeholder="Location"
                      value={formValues.location}
                      onChange={updateField}
                    />
                  </div>

                  <textarea
                    name="notes"
                    placeholder="Additional Notes"
                    value={formValues.notes}
                    onChange={updateField}
                  />
                </div>
              )}
            </div>

            {successMessage ? (
              <p className="hunt-success-message">{successMessage}</p>
            ) : null}

            {errorMessage ? (
              <p className="hunt-error-message">{errorMessage}</p>
            ) : null}

            <div className="hunt-form-actions">
              <button
                type="button"
                className="secondary"
                disabled={step === 1 || isSubmitting}
                onClick={() => setStep(step - 1)}
              >
                Back
              </button>

              {step < 3 ? (
                <button type="button" onClick={goNext}>
                  Next Step
                </button>
              ) : (
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </button>
              )}
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}