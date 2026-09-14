"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "./vendor-login.css";

export default function VendorLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sendOtp = async () => {
    setError("");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your registered email.");
      return;
    }

    setLoading(true);

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
        setError(data.error || "Unable to send OTP.");
        return;
      }

      setOtpSent(true);
      setMessage("OTP sent to your registered email.");
    } catch {
      setError("Unable to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError("");
    setMessage("");

    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/vendor/login/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            otp: otp.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to verify OTP.");
        return;
      }

      router.push("/vendor/dashboard");
    } catch {
      setError("Unable to verify OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="vendor-login-page">
      <div className="vendor-login-shell">
        <section className="vendor-login-intro">
          <span className="vendor-login-eyebrow">
            Sparesco Vendor Portal
          </span>

          <h1>
            Manage your products,
            <br />
            enquiries and quotations.
          </h1>

          <p>
            Sign in securely using your registered email address.
            No password required.
          </p>

          <div className="vendor-login-points">
            <div>
              <span>01</span>
              <p>Secure email OTP access</p>
            </div>

            <div>
              <span>02</span>
              <p>Submit and manage approved products</p>
            </div>

            <div>
              <span>03</span>
              <p>Receive enquiries and submit quotations</p>
            </div>
          </div>
        </section>

        <section className="vendor-login-card">
          <div className="vendor-login-card-top">
            <span className="vendor-login-badge">
              Vendor Sign In
            </span>

            <h2>
              {otpSent
                ? "Enter your OTP"
                : "Welcome back"}
            </h2>

            <p>
              {otpSent
                ? `We sent a 6-digit OTP to ${email}.`
                : "Enter your registered email to continue."}
            </p>
          </div>

          <div className="vendor-login-form">
            <div className="vendor-login-field">
              <label htmlFor="vendor-email">
                Registered Email
              </label>

              <input
                id="vendor-email"
                type="email"
                value={email}
                disabled={otpSent}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                autoComplete="email"
              />
            </div>

            {!otpSent && (
              <button
                type="button"
                className="vendor-login-primary"
                onClick={sendOtp}
                disabled={loading}
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            )}

            {otpSent && (
              <>
                <div className="vendor-login-field vendor-login-otp-field">
                  <label htmlFor="vendor-otp">
                    6-Digit OTP
                  </label>

                  <input
                    id="vendor-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) =>
                      setOtp(
                        e.target.value.replace(/\D/g, "")
                      )
                    }
                    placeholder="000000"
                    autoComplete="one-time-code"
                  />
                </div>

                <button
                  type="button"
                  className="vendor-login-primary"
                  onClick={verifyOtp}
                  disabled={loading}
                >
                  {loading
                    ? "Verifying..."
                    : "Verify & Sign In"}
                </button>

                <div className="vendor-login-actions">
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={loading}
                  >
                    Resend OTP
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                      setMessage("");
                      setError("");
                    }}
                  >
                    Change Email
                  </button>
                </div>
              </>
            )}

            {message && (
              <div className="vendor-login-message vendor-login-success">
                {message}
              </div>
            )}

            {error && (
              <div className="vendor-login-message vendor-login-error">
                {error}
              </div>
            )}
          </div>

          <div className="vendor-login-footer">
            <span>New to Sparesco?</span>

            <Link href="/vendor/register">
              Create Vendor Account
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}