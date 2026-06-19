"use client";

import { useState } from "react";
import Link from "next/link";
import "./contact.css";

const countryCodes = [
  { label: "India +91", code: "+91", min: 10, max: 10 },
  { label: "United States +1", code: "+1", min: 10, max: 10 },
  { label: "United Kingdom +44", code: "+44", min: 10, max: 11 },
  { label: "UAE +971", code: "+971", min: 9, max: 9 },
  { label: "Saudi Arabia +966", code: "+966", min: 9, max: 9 },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    country: countryCodes[0],
    phone: "",
    role: "",
    message: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function updateField(name: string, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function submitForm(e: React.FormEvent) {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    const phoneDigits = form.phone.replace(/\D/g, "");

    if (!form.name.trim()) newErrors.name = "Name is required.";
    if (!form.email.trim()) newErrors.email = "Email is required.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = "Enter a valid email.";
    }
    if (!phoneDigits) newErrors.phone = "Phone number is required.";
    if (
      phoneDigits.length < form.country.min ||
      phoneDigits.length > form.country.max
    ) {
      newErrors.phone = `Enter a valid ${form.country.label} phone number.`;
    }
    if (!form.role) newErrors.role = "Please select buyer or seller.";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      alert("Thank you. Your enquiry has been submitted.");
      setForm({
        name: "",
        email: "",
        country: countryCodes[0],
        phone: "",
        role: "",
        message: "",
      });
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

              <label>
                <select
                  value={form.country.code}
                  onChange={(e) => {
                    const selected = countryCodes.find(
                      (country) => country.code === e.target.value
                    )!;
                    setForm((prev) => ({ ...prev, country: selected }));
                  }}
                >
                  {countryCodes.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <input
                  type="tel"
                  placeholder="Phone No*"
                  value={form.phone}
                  onChange={(e) =>
                    updateField("phone", e.target.value.replace(/[^\d]/g, ""))
                  }
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

            <button type="submit">Submit</button>
          </form>
        </section>
      </div>
    </main>
  );
}