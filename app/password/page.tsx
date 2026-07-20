"use client";

import "./password.css";
import { FormEvent, useState } from "react";

export default function PasswordPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to unlock the website.");
        return;
      }

      window.location.href = "/";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="password-page">
      <form className="password-card" onSubmit={handleSubmit}>
        <div className="password-logo">SPARESCO</div>

        <h1>Website under preparation</h1>

        <p>
          We are preparing the new Sparesco website. Enter the access password
          to continue.
        </p>

        <label htmlFor="password">Access password</label>

        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter password"
          autoComplete="current-password"
          required
        />

        {error && <p className="password-error">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? "Checking..." : "Enter website"}
        </button>
      </form>
    </main>
  );
}