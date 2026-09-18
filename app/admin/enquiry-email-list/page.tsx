"use client";

import { useEffect, useMemo, useState } from "react";

type Recipient = {
  id: number;
  email: string;
  is_active: number;
  created_at: string;
};

export default function AdminEnquiryEmailListPage() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadRecipients = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/enquiry-email-list", {
        cache: "no-store",
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (!response.ok) {
        setError(data.error || "Unable to load enquiry email list.");
        return;
      }

      setRecipients(data.recipients || []);
    } catch {
      setError("Unable to load enquiry email list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecipients();
  }, []);

  const addEmail = async (event: React.FormEvent) => {
    event.preventDefault();

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Please enter an email address.");
      return;
    }

    setAdding(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/enquiry-email-list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cleanEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to add email address.");
        return;
      }

      setEmail("");
      setMessage("Email added successfully.");
      await loadRecipients();
    } catch {
      setError("Unable to add email address.");
    } finally {
      setAdding(false);
    }
  };

  const toggleRecipient = async (recipient: Recipient) => {
    setUpdatingId(recipient.id);
    setMessage("");
    setError("");

    const nextActive = recipient.is_active !== 1;

    try {
      const response = await fetch("/api/admin/enquiry-email-list", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: recipient.id,
          is_active: nextActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to update recipient.");
        return;
      }

      setRecipients((current) =>
        current.map((item) =>
          item.id === recipient.id
            ? {
                ...item,
                is_active: nextActive ? 1 : 0,
              }
            : item
        )
      );

      setMessage(
        nextActive
          ? "Recipient activated."
          : "Recipient deactivated."
      );
    } catch {
      setError("Unable to update recipient.");
    } finally {
      setUpdatingId(null);
    }
  };

  const removeRecipient = async (recipient: Recipient) => {
    const confirmed = window.confirm(
      `Remove ${recipient.email} from the enquiry email list?`
    );

    if (!confirmed) return;

    setUpdatingId(recipient.id);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/enquiry-email-list", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: recipient.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to remove email address.");
        return;
      }

      setRecipients((current) =>
        current.filter((item) => item.id !== recipient.id)
      );

      setMessage("Email removed successfully.");
    } catch {
      setError("Unable to remove email address.");
    } finally {
      setUpdatingId(null);
    }
  };

  const visibleRecipients = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return recipients;

    return recipients.filter((recipient) =>
      recipient.email.toLowerCase().includes(query)
    );
  }, [recipients, search]);

  const activeCount = recipients.filter(
    (recipient) => recipient.is_active === 1
  ).length;

  if (loading) {
    return (
      <main style={pageStyle}>
        <p>Loading enquiry email list...</p>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={titleStyle}>Enquiry Email List</h1>

          <p style={subtitleStyle}>
            Manage recipients used for enquiry list emails.
          </p>
        </div>

        <div style={countStyle}>
          {activeCount} Active / {recipients.length} Total
        </div>
      </div>

      {message && <div style={successStyle}>{message}</div>}
      {error && <div style={errorStyle}>{error}</div>}

      <div style={addCardStyle}>
        <div>
          <h2 style={addTitleStyle}>Add Recipient</h2>

          <p style={addDescriptionStyle}>
            Add an email address to the enquiry recipient list.
          </p>
        </div>

        <form onSubmit={addEmail} style={addFormStyle}>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter email address"
            style={emailInputStyle}
          />

          <button
            type="submit"
            disabled={adding}
            style={{
              ...addButtonStyle,
              opacity: adding ? 0.5 : 1,
            }}
          >
            {adding ? "Adding..." : "Add Email"}
          </button>
        </form>
      </div>

      <div style={searchWrapStyle}>
        <span style={searchIconStyle}>⌕</span>

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search email list..."
          style={searchInputStyle}
        />
      </div>

      {visibleRecipients.length === 0 ? (
        <div style={emptyStyle}>
          {search
            ? "No email addresses match your search."
            : "No email addresses have been added yet."}
        </div>
      ) : (
        <>
          <div style={tableHeaderStyle}>
            <span>Email Address</span>
            <span>Added</span>
            <span>Status</span>
            <span></span>
          </div>

          <div style={listStyle}>
            {visibleRecipients.map((recipient) => {
              const active = recipient.is_active === 1;
              const updating = updatingId === recipient.id;

              return (
                <div key={recipient.id} style={recipientRowStyle}>
                  <span style={emailValueStyle}>
                    {recipient.email}
                  </span>

                  <span style={dateStyle}>
                    {recipient.created_at
                      ? new Date(
                          recipient.created_at
                        ).toLocaleDateString()
                      : "—"}
                  </span>

                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => toggleRecipient(recipient)}
                    style={{
                      ...statusButtonStyle,
                      ...(active
                        ? activeStatusStyle
                        : inactiveStatusStyle),
                      opacity: updating ? 0.5 : 1,
                    }}
                  >
                    {active ? "Active" : "Inactive"}
                  </button>

                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => removeRecipient(recipient)}
                    style={{
                      ...removeButtonStyle,
                      opacity: updating ? 0.5 : 1,
                    }}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  maxWidth: "1250px",
  margin: "0 auto",
  padding: "42px 24px 70px",
};

const pageHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "20px",
  marginBottom: "22px",
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 7px",
  color: "#173f4c",
  fontSize: "32px",
};

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#67797f",
};

const countStyle: React.CSSProperties = {
  padding: "9px 14px",
  background: "#ffffff",
  border: "1px solid #dfe6e4",
  borderRadius: "9px",
  color: "#173f4c",
  fontSize: "13px",
  fontWeight: 700,
};

const addCardStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "30px",
  padding: "18px",
  marginBottom: "14px",
  background: "#ffffff",
  border: "1px solid #dfe6e4",
  borderRadius: "10px",
};

const addTitleStyle: React.CSSProperties = {
  margin: "0 0 4px",
  color: "#173f4c",
  fontSize: "14px",
};

const addDescriptionStyle: React.CSSProperties = {
  margin: 0,
  color: "#718086",
  fontSize: "11px",
};

const addFormStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  width: "460px",
  maxWidth: "100%",
};

const emailInputStyle: React.CSSProperties = {
  flex: 1,
  height: "40px",
  padding: "0 12px",
  border: "1px solid #d9e1df",
  borderRadius: "7px",
  background: "#ffffff",
  color: "#173f4c",
  fontSize: "12px",
  outline: "none",
};

const addButtonStyle: React.CSSProperties = {
  height: "40px",
  padding: "0 15px",
  border: "none",
  borderRadius: "7px",
  background: "#173f4c",
  color: "#ffffff",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const searchWrapStyle: React.CSSProperties = {
  position: "relative",
  marginBottom: "18px",
};

const searchIconStyle: React.CSSProperties = {
  position: "absolute",
  left: "13px",
  top: "50%",
  transform: "translateY(-50%)",
  color: "#819095",
  fontSize: "17px",
  pointerEvents: "none",
};

const searchInputStyle: React.CSSProperties = {
  width: "100%",
  height: "42px",
  padding: "0 14px 0 38px",
  border: "1px solid #d9e1df",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#173f4c",
  fontSize: "13px",
  outline: "none",
};

const tableHeaderStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(280px, 1fr) 140px 110px 90px",
  gap: "16px",
  padding: "0 18px 8px",
  color: "#879398",
  fontSize: "9px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: "9px",
};

const recipientRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(280px, 1fr) 140px 110px 90px",
  gap: "16px",
  alignItems: "center",
  padding: "14px 18px",
  background: "#ffffff",
  border: "1px solid #dfe6e4",
  borderRadius: "10px",
};

const emailValueStyle: React.CSSProperties = {
  color: "#43575d",
  fontSize: "13px",
  overflowWrap: "anywhere",
};

const dateStyle: React.CSSProperties = {
  color: "#718086",
  fontSize: "11px",
};

const statusButtonStyle: React.CSSProperties = {
  width: "fit-content",
  borderRadius: "999px",
  padding: "6px 10px",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
};

const activeStatusStyle: React.CSSProperties = {
  border: "1px solid #d3ebdf",
  background: "#eaf6ef",
  color: "#286647",
};

const inactiveStatusStyle: React.CSSProperties = {
  border: "1px solid #e2e5e4",
  background: "#f3f5f4",
  color: "#718086",
};

const removeButtonStyle: React.CSSProperties = {
  border: "1px solid #d9dddd",
  background: "#ffffff",
  color: "#6c5552",
  borderRadius: "7px",
  padding: "7px 11px",
  fontSize: "11px",
  cursor: "pointer",
};

const successStyle: React.CSSProperties = {
  marginBottom: "18px",
  padding: "12px 15px",
  background: "#eef8f3",
  border: "1px solid #d3ebdf",
  borderRadius: "9px",
  color: "#286647",
};

const errorStyle: React.CSSProperties = {
  marginBottom: "18px",
  padding: "12px 15px",
  background: "#fff3f1",
  border: "1px solid #f2d4d0",
  borderRadius: "9px",
  color: "#a23c35",
};

const emptyStyle: React.CSSProperties = {
  padding: "50px",
  background: "#ffffff",
  border: "1px solid #dfe6e4",
  borderRadius: "12px",
  textAlign: "center",
  color: "#718086",
};