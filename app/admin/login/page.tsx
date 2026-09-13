"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Unable to login.");
        return;
      }

      router.push("/admin/vendors");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Unable to login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <form
        onSubmit={submitLogin}
        style={{
          width: "100%",
          maxWidth: "420px",
          border: "1px solid #ddd",
          borderRadius: "12px",
          padding: "30px",
          background: "#fff",
        }}
      >
        <h1 style={{ marginBottom: "20px" }}>Admin Login</h1>

        <label
          htmlFor="password"
          style={{ display: "block", marginBottom: "8px" }}
        >
          Password
        </label>

        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoFocus
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "16px",
            border: "1px solid #ccc",
            borderRadius: "6px",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            cursor: "pointer",
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </main>
  );
}