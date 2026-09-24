"use client";

import { useEffect, useMemo, useState } from "react";

type Category = {
  id: number;
  name: string;
  is_active: number;
  created_at: string;
};

type Recipient = {
  id: number;
  email: string;
  is_active: number;
  created_at: string;
  category_ids: number[];
};

export default function AdminEnquiryEmailListPage() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [categoryName, setCategoryName] = useState("");

  const [search, setSearch] = useState("");

  const [adding, setAdding] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [updatingCategoryId, setUpdatingCategoryId] =
    useState<number | null>(null);

  const [editingRecipientId, setEditingRecipientId] =
    useState<number | null>(null);

  const [editingCategoryIds, setEditingCategoryIds] =
    useState<number[]>([]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /* =========================
     LOAD
  ========================= */

  async function loadData() {
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
      setCategories(data.categories || []);
    } catch {
      setError("Unable to load enquiry email list.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /* =========================
     ADD CATEGORY
  ========================= */

  async function addCategory(event: React.FormEvent) {
    event.preventDefault();

    const cleanName = categoryName.trim();

    if (!cleanName) {
      setError("Please enter a category name.");
      return;
    }

    setAddingCategory(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/enquiry-email-list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "add_category",
          name: cleanName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to add category.");
        return;
      }

      setCategoryName("");
      setMessage("Category added successfully.");
      await loadData();
    } catch {
      setError("Unable to add category.");
    } finally {
      setAddingCategory(false);
    }
  }

  /* =========================
     CATEGORY ACTIVE / INACTIVE
  ========================= */

  async function toggleCategory(category: Category) {
    setUpdatingCategoryId(category.id);
    setMessage("");
    setError("");

    const nextActive = category.is_active !== 1;

    try {
      const response = await fetch("/api/admin/enquiry-email-list", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "toggle_category",
          id: category.id,
          is_active: nextActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to update category.");
        return;
      }

      setCategories((current) =>
        current.map((item) =>
          item.id === category.id
            ? {
                ...item,
                is_active: nextActive ? 1 : 0,
              }
            : item
        )
      );

      setMessage(
        nextActive
          ? "Category activated."
          : "Category deactivated."
      );
    } catch {
      setError("Unable to update category.");
    } finally {
      setUpdatingCategoryId(null);
    }
  }

  /* =========================
     DELETE CATEGORY
  ========================= */

  async function removeCategory(category: Category) {
    const confirmed = window.confirm(
      `Remove category "${category.name}"? Existing email addresses will not be deleted.`
    );

    if (!confirmed) return;

    setUpdatingCategoryId(category.id);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/enquiry-email-list", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete_category",
          id: category.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to remove category.");
        return;
      }

      setMessage("Category removed successfully.");
      await loadData();
    } catch {
      setError("Unable to remove category.");
    } finally {
      setUpdatingCategoryId(null);
    }
  }

  /* =========================
     ADD RECIPIENT
  ========================= */

  async function addEmail(event: React.FormEvent) {
    event.preventDefault();

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Please enter an email address.");
      return;
    }

    if (selectedCategoryIds.length === 0) {
      setError("Please select at least one category.");
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
          action: "add_recipient",
          email: cleanEmail,
          category_ids: selectedCategoryIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to add email address.");
        return;
      }

      setEmail("");
      setSelectedCategoryIds([]);
      setMessage("Email added successfully.");
      await loadData();
    } catch {
      setError("Unable to add email address.");
    } finally {
      setAdding(false);
    }
  }

  /* =========================
     NEW RECIPIENT CATEGORY
     SELECTION
  ========================= */

  function toggleSelectedCategory(categoryId: number) {
    setSelectedCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId]
    );
  }

  /* =========================
     RECIPIENT ACTIVE / INACTIVE
  ========================= */

  async function toggleRecipient(recipient: Recipient) {
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
  }

  /* =========================
     EDIT RECIPIENT CATEGORIES
  ========================= */

  function startEditingRecipient(recipient: Recipient) {
    setEditingRecipientId(recipient.id);
    setEditingCategoryIds(recipient.category_ids || []);
    setMessage("");
    setError("");
  }

  function cancelEditingRecipient() {
    setEditingRecipientId(null);
    setEditingCategoryIds([]);
  }

  function toggleEditingCategory(categoryId: number) {
    setEditingCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId]
    );
  }

  async function saveRecipientCategories(recipientId: number) {
    if (editingCategoryIds.length === 0) {
      setError("Please select at least one category.");
      return;
    }

    setUpdatingId(recipientId);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/enquiry-email-list", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update_categories",
          id: recipientId,
          category_ids: editingCategoryIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error || "Unable to update recipient categories."
        );
        return;
      }

      setMessage("Recipient categories updated.");
      setEditingRecipientId(null);
      setEditingCategoryIds([]);
      await loadData();
    } catch {
      setError("Unable to update recipient categories.");
    } finally {
      setUpdatingId(null);
    }
  }

  /* =========================
     DELETE RECIPIENT
  ========================= */

  async function removeRecipient(recipient: Recipient) {
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
  }

  /* =========================
     HELPERS
  ========================= */

  function categoryNameFromId(categoryId: number) {
    return (
      categories.find(
        (category) => Number(category.id) === Number(categoryId)
      )?.name || ""
    );
  }

  const activeCategories = categories.filter(
    (category) => Number(category.is_active) === 1
  );

  const visibleRecipients = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return recipients;

    return recipients.filter((recipient) => {
      const emailMatch = recipient.email
        .toLowerCase()
        .includes(query);

      const categoryMatch = (recipient.category_ids || []).some(
        (categoryId) =>
          categories
            .find(
              (category) =>
                Number(category.id) === Number(categoryId)
            )
            ?.name.toLowerCase()
            .includes(query)
      );

      return emailMatch || categoryMatch;
    });
  }, [recipients, categories, search]);

  const activeCount = recipients.filter(
    (recipient) => Number(recipient.is_active) === 1
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
      {/* PAGE HEADER */}

      <div style={pageHeaderStyle}>
        <div>
          <h1 style={titleStyle}>Enquiry Email List</h1>

          <p style={subtitleStyle}>
            Manage enquiry categories and email recipients.
          </p>
        </div>

        <div style={countStyle}>
          {activeCount} Active / {recipients.length} Total
        </div>
      </div>

      {message && <div style={successStyle}>{message}</div>}
      {error && <div style={errorStyle}>{error}</div>}

      {/* =========================
          CATEGORIES
      ========================= */}

      <div style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <h2 style={sectionTitleStyle}>Categories</h2>

            <p style={sectionDescriptionStyle}>
              Create categories used to route enquiry emails.
            </p>
          </div>

          <form onSubmit={addCategory} style={categoryAddFormStyle}>
            <input
              type="text"
              value={categoryName}
              onChange={(event) =>
                setCategoryName(event.target.value)
              }
              placeholder="e.g. Filter"
              style={categoryInputStyle}
            />

            <button
              type="submit"
              disabled={addingCategory}
              style={{
                ...addButtonStyle,
                opacity: addingCategory ? 0.5 : 1,
              }}
            >
              {addingCategory ? "Adding..." : "Add Category"}
            </button>
          </form>
        </div>

        {categories.length === 0 ? (
          <div style={categoryEmptyStyle}>
            No categories added yet. Add your first category above.
          </div>
        ) : (
          <div style={categoryListStyle}>
            {categories.map((category) => {
              const active =
                Number(category.is_active) === 1;

              const updating =
                updatingCategoryId === category.id;

              const assignedCount = recipients.filter(
                (recipient) =>
                  (recipient.category_ids || []).includes(
                    category.id
                  )
              ).length;

              return (
                <div
                  key={category.id}
                  style={{
                    ...categoryChipStyle,
                    ...(active
                      ? {}
                      : inactiveCategoryChipStyle),
                  }}
                >
                  <div style={categoryChipMainStyle}>
                    <span style={categoryNameStyle}>
                      {category.name}
                    </span>

                    <span style={categoryCountStyle}>
                      {assignedCount}{" "}
                      {assignedCount === 1
                        ? "recipient"
                        : "recipients"}
                    </span>
                  </div>

                  <div style={categoryActionsStyle}>
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => toggleCategory(category)}
                      style={{
                        ...miniStatusButtonStyle,
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
                      onClick={() => removeCategory(category)}
                      style={{
                        ...miniRemoveButtonStyle,
                        opacity: updating ? 0.5 : 1,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================
          ADD RECIPIENT
      ========================= */}

      <div style={addCardStyle}>
        <div style={addRecipientInfoStyle}>
          <h2 style={addTitleStyle}>Add Recipient</h2>

          <p style={addDescriptionStyle}>
            Add an email address and assign one or more categories.
          </p>
        </div>

        <form onSubmit={addEmail} style={recipientFormStyle}>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter email address"
            style={emailInputStyle}
          />

          <div style={categorySelectorStyle}>
            {activeCategories.length === 0 ? (
              <span style={noCategoryTextStyle}>
                Add an active category first.
              </span>
            ) : (
              activeCategories.map((category) => {
                const selected =
                  selectedCategoryIds.includes(category.id);

                return (
                  <label
                    key={category.id}
                    style={{
                      ...categoryOptionStyle,
                      ...(selected
                        ? selectedCategoryOptionStyle
                        : {}),
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() =>
                        toggleSelectedCategory(category.id)
                      }
                      style={checkboxStyle}
                    />

                    {category.name}
                  </label>
                );
              })
            )}
          </div>

          <button
            type="submit"
            disabled={
              adding ||
              activeCategories.length === 0
            }
            style={{
              ...addButtonStyle,
              opacity:
                adding ||
                activeCategories.length === 0
                  ? 0.5
                  : 1,
            }}
          >
            {adding ? "Adding..." : "Add Email"}
          </button>
        </form>
      </div>

      {/* SEARCH */}

      <div style={searchWrapStyle}>
        <span style={searchIconStyle}>⌕</span>

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search email or category..."
          style={searchInputStyle}
        />
      </div>

      {/* =========================
          RECIPIENT LIST
      ========================= */}

      {visibleRecipients.length === 0 ? (
        <div style={emptyStyle}>
          {search
            ? "No recipients match your search."
            : "No email addresses have been added yet."}
        </div>
      ) : (
        <>
          <div style={tableHeaderStyle}>
            <span>Email Address</span>
            <span>Categories</span>
            <span>Added</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          <div style={listStyle}>
            {visibleRecipients.map((recipient) => {
              const active =
                Number(recipient.is_active) === 1;

              const updating =
                updatingId === recipient.id;

              const editing =
                editingRecipientId === recipient.id;

              return (
                <div
                  key={recipient.id}
                  style={recipientCardStyle}
                >
                  <div style={recipientRowStyle}>
                    <span style={emailValueStyle}>
                      {recipient.email}
                    </span>

                    <div style={recipientCategoriesStyle}>
                      {(recipient.category_ids || []).length ===
                      0 ? (
                        <span style={unassignedStyle}>
                          Unassigned
                        </span>
                      ) : (
                        recipient.category_ids.map(
                          (categoryId) => {
                            const name =
                              categoryNameFromId(categoryId);

                            if (!name) return null;

                            return (
                              <span
                                key={categoryId}
                                style={categoryBadgeStyle}
                              >
                                {name}
                              </span>
                            );
                          }
                        )
                      )}
                    </div>

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
                      onClick={() =>
                        toggleRecipient(recipient)
                      }
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

                    <div style={rowActionsStyle}>
                      <button
                        type="button"
                        disabled={updating}
                        onClick={() =>
                          editing
                            ? cancelEditingRecipient()
                            : startEditingRecipient(
                                recipient
                              )
                        }
                        style={editButtonStyle}
                      >
                        {editing ? "Cancel" : "Edit"}
                      </button>

                      <button
                        type="button"
                        disabled={updating}
                        onClick={() =>
                          removeRecipient(recipient)
                        }
                        style={{
                          ...removeButtonStyle,
                          opacity: updating ? 0.5 : 1,
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {editing && (
                    <div style={editPanelStyle}>
                      <div>
                        <strong style={editPanelTitleStyle}>
                          Categories for {recipient.email}
                        </strong>

                        <p style={editPanelDescriptionStyle}>
                          Select one or more categories for this
                          recipient.
                        </p>
                      </div>

                      <div style={editCategoryListStyle}>
                        {activeCategories.map((category) => {
                          const selected =
                            editingCategoryIds.includes(
                              category.id
                            );

                          return (
                            <label
                              key={category.id}
                              style={{
                                ...categoryOptionStyle,
                                ...(selected
                                  ? selectedCategoryOptionStyle
                                  : {}),
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() =>
                                  toggleEditingCategory(
                                    category.id
                                  )
                                }
                                style={checkboxStyle}
                              />

                              {category.name}
                            </label>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        disabled={updating}
                        onClick={() =>
                          saveRecipientCategories(
                            recipient.id
                          )
                        }
                        style={{
                          ...saveButtonStyle,
                          opacity: updating ? 0.5 : 1,
                        }}
                      >
                        {updating
                          ? "Saving..."
                          : "Save Categories"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}

/* =========================
   PAGE
========================= */

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

/* =========================
   CATEGORY SECTION
========================= */

const sectionCardStyle: React.CSSProperties = {
  padding: "18px",
  marginBottom: "14px",
  background: "#ffffff",
  border: "1px solid #dfe6e4",
  borderRadius: "10px",
};

const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "30px",
  marginBottom: "16px",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 4px",
  color: "#173f4c",
  fontSize: "14px",
};

const sectionDescriptionStyle: React.CSSProperties = {
  margin: 0,
  color: "#718086",
  fontSize: "11px",
};

const categoryAddFormStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  width: "430px",
  maxWidth: "100%",
};

const categoryInputStyle: React.CSSProperties = {
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

const categoryListStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
};

const categoryChipStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "9px 10px 9px 12px",
  border: "1px solid #d9e4e3",
  borderRadius: "9px",
  background: "#f9fbfa",
};

const inactiveCategoryChipStyle: React.CSSProperties = {
  opacity: 0.65,
  background: "#f4f5f5",
};

const categoryChipMainStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "2px",
};

const categoryNameStyle: React.CSSProperties = {
  color: "#173f4c",
  fontSize: "12px",
  fontWeight: 800,
};

const categoryCountStyle: React.CSSProperties = {
  color: "#819095",
  fontSize: "9px",
};

const categoryActionsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "5px",
};

const miniStatusButtonStyle: React.CSSProperties = {
  borderRadius: "999px",
  padding: "4px 7px",
  fontSize: "9px",
  fontWeight: 700,
  cursor: "pointer",
};

const miniRemoveButtonStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#9b625e",
  fontSize: "9px",
  cursor: "pointer",
  padding: "4px",
};

const categoryEmptyStyle: React.CSSProperties = {
  padding: "14px",
  border: "1px dashed #d9e1df",
  borderRadius: "8px",
  color: "#819095",
  fontSize: "11px",
};

/* =========================
   ADD RECIPIENT
========================= */

const addCardStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "30px",
  padding: "18px",
  marginBottom: "14px",
  background: "#ffffff",
  border: "1px solid #dfe6e4",
  borderRadius: "10px",
};

const addRecipientInfoStyle: React.CSSProperties = {
  minWidth: "190px",
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

const recipientFormStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  flex: 1,
  justifyContent: "flex-end",
};

const emailInputStyle: React.CSSProperties = {
  width: "280px",
  height: "40px",
  padding: "0 12px",
  border: "1px solid #d9e1df",
  borderRadius: "7px",
  background: "#ffffff",
  color: "#173f4c",
  fontSize: "12px",
  outline: "none",
  boxSizing: "border-box",
};

const categorySelectorStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  maxWidth: "430px",
  minHeight: "40px",
  alignItems: "center",
};

const categoryOptionStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  minHeight: "32px",
  padding: "0 9px",
  border: "1px solid #dce4e2",
  borderRadius: "7px",
  background: "#ffffff",
  color: "#617278",
  fontSize: "10px",
  cursor: "pointer",
};

const selectedCategoryOptionStyle: React.CSSProperties = {
  borderColor: "#9ec4c9",
  background: "#eef7f7",
  color: "#173f4c",
  fontWeight: 700,
};

const checkboxStyle: React.CSSProperties = {
  width: "14px",
  height: "14px",
  accentColor: "#2a8392",
  cursor: "pointer",
};

const noCategoryTextStyle: React.CSSProperties = {
  color: "#a23c35",
  fontSize: "10px",
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

/* =========================
   SEARCH
========================= */

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

/* =========================
   RECIPIENT TABLE
========================= */

const tableHeaderStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "minmax(230px, 1.2fr) minmax(250px, 1.4fr) 110px 100px 150px",
  gap: "14px",
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

const recipientCardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #dfe6e4",
  borderRadius: "10px",
  overflow: "hidden",
};

const recipientRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "minmax(230px, 1.2fr) minmax(250px, 1.4fr) 110px 100px 150px",
  gap: "14px",
  alignItems: "center",
  padding: "14px 18px",
};

const emailValueStyle: React.CSSProperties = {
  color: "#43575d",
  fontSize: "13px",
  overflowWrap: "anywhere",
};

const recipientCategoriesStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "5px",
};

const categoryBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "#edf6f6",
  border: "1px solid #d2e5e5",
  color: "#2a6e78",
  fontSize: "9px",
  fontWeight: 700,
};

const unassignedStyle: React.CSSProperties = {
  color: "#a23c35",
  fontSize: "10px",
  fontStyle: "italic",
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

const rowActionsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const editButtonStyle: React.CSSProperties = {
  border: "1px solid #c9d9da",
  background: "#ffffff",
  color: "#2a8392",
  borderRadius: "7px",
  padding: "7px 10px",
  fontSize: "10px",
  fontWeight: 700,
  cursor: "pointer",
};

const removeButtonStyle: React.CSSProperties = {
  border: "1px solid #d9dddd",
  background: "#ffffff",
  color: "#6c5552",
  borderRadius: "7px",
  padding: "7px 10px",
  fontSize: "10px",
  cursor: "pointer",
};

/* =========================
   EDIT PANEL
========================= */

const editPanelStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "220px 1fr auto",
  gap: "20px",
  alignItems: "center",
  padding: "14px 18px",
  borderTop: "1px solid #edf1f0",
  background: "#f9fbfa",
};

const editPanelTitleStyle: React.CSSProperties = {
  color: "#173f4c",
  fontSize: "11px",
};

const editPanelDescriptionStyle: React.CSSProperties = {
  margin: "3px 0 0",
  color: "#819095",
  fontSize: "9px",
};

const editCategoryListStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
};

const saveButtonStyle: React.CSSProperties = {
  height: "34px",
  padding: "0 12px",
  border: "none",
  borderRadius: "7px",
  background: "#2a8392",
  color: "#ffffff",
  fontSize: "10px",
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

/* =========================
   MESSAGES
========================= */

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