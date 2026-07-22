"use client";

import { FormEvent, useRef, useState } from "react";

export default function HomePartnerForm() {
  const notificationRef = useRef<HTMLDivElement | null>(null);

  const [formValues, setFormValues] = useState({
    firstName: "",
    companyName: "",
    email: "",
    phone: "",
    productsToList: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const scrollToNotification = () => {
    window.setTimeout(() => {
      notificationRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 50);
  };

  const updateField = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormValues((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    const firstName = formValues.firstName.trim();
    const companyName = formValues.companyName.trim();
    const email = formValues.email.trim();
    const phone = formValues.phone.trim();
    const productsToList = formValues.productsToList.trim();

    if (!firstName || !email || !phone || !productsToList) {
      setErrorMessage("Please fill all required fields.");
      scrollToNotification();
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/website-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
            formType: "homepage",
            name: firstName,
            companyName,
            email,
            phone,
            productsToList,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Unable to submit application."
        );
      }

      setSuccessMessage(
        "Our team will contact you soon."
      );

      setFormValues({
        firstName: "",
        companyName: "",
        email: "",
        phone: "",
        productsToList: "",
      });

      scrollToNotification();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit application. Please try again."
      );

      scrollToNotification();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form className="partner-form-wide" onSubmit={submitForm}>
        <input
          name="firstName"
          placeholder="First Name *"
          value={formValues.firstName}
          onChange={updateField}
        />

        <input
          name="companyName"
          placeholder="Company Name"
          value={formValues.companyName}
          onChange={updateField}
        />

        <input
          name="email"
          type="email"
          placeholder="Email *"
          value={formValues.email}
          onChange={updateField}
        />

        <input
          name="phone"
          type="tel"
          placeholder="Phone *"
          value={formValues.phone}
          onChange={updateField}
        />

        <textarea
          name="productsToList"
          placeholder="Products to List *"
          value={formValues.productsToList}
          onChange={updateField}
        />

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Application"}
        </button>
      </form>

      {(successMessage || errorMessage) && (
        <div
          ref={notificationRef}
          className="home-partner-notification"
        >
          {successMessage ? (
            <div
              className="contact-form-notification contact-form-notification-success"
              role="status"
            >
              <strong>Application submitted successfully</strong>
              <p>{successMessage}</p>
            </div>
          ) : null}

          {errorMessage ? (
            <div
              className="contact-form-notification contact-form-notification-error"
              role="alert"
            >
              <strong>Please check the form</strong>
              <p>{errorMessage}</p>
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}