"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

function slugify(
  value: string
) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function NewCollectionPage() {
  const router =
    useRouter();

  const [
    title,
    setTitle,
  ] = useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    handle,
    setHandle,
  ] = useState("");

  const [
    handleEdited,
    setHandleEdited,
  ] = useState(false);

  const [
    seoTitle,
    setSeoTitle,
  ] = useState("");

  const [
    seoDescription,
    setSeoDescription,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const effectiveHandle =
    useMemo(
      () =>
        handleEdited
          ? slugify(handle)
          : slugify(title),
      [
        handle,
        handleEdited,
        title,
      ]
    );

  const previewTitle =
    seoTitle.trim() ||
    title.trim() ||
    "Collection title";

  const previewDescription =
    seoDescription.trim() ||
    description.trim();

  function changeTitle(
    value: string
  ) {
    setTitle(value);

    if (!handleEdited) {
      setHandle(
        slugify(value)
      );
    }
  }

  async function saveCollection() {
    const cleanTitle =
      title.trim();

    if (!cleanTitle) {
      setError(
        "Collection title is required."
      );
      return;
    }

    if (!effectiveHandle) {
      setError(
        "Collection URL handle is required."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response =
        await fetch(
          "/api/admin/collections",
          {
            method: "POST",

            headers: {
              "content-type":
                "application/json",
            },

            body:
              JSON.stringify({
                title:
                  cleanTitle,

                handle:
                  effectiveHandle,

                description:
                  description.trim(),

                seoTitle:
                  seoTitle.trim(),

                seoDescription:
                  seoDescription.trim(),
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Unable to create collection."
        );
      }

      router.push(
        `/admin/collections/${encodeURIComponent(
          effectiveHandle
        )}`
      );

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to create collection."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="admin-dashboard">
      <div className="admin-collection-editor-top">
        <div>
          <Link
            href="/admin/collections"
            className="admin-collection-back"
          >
            ← Collections
          </Link>

          <h1>
            Create collection
          </h1>
        </div>

        <button
          type="button"
          className="admin-primary-button"
          onClick={
            saveCollection
          }
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : "Save"}
        </button>
      </div>

      {error ? (
        <div className="admin-collection-error-banner">
          {error}
        </div>
      ) : null}

      <div className="admin-collection-editor-layout">
        <div className="admin-collection-editor-main">
          <section className="admin-collection-editor-card">
            <div className="admin-collection-field">
              <label
                htmlFor="collection-title"
              >
                Title
              </label>

              <input
                id="collection-title"
                type="text"
                value={title}
                onChange={(event) =>
                  changeTitle(
                    event.target.value
                  )
                }
                placeholder="e.g. Fleetguard Filters"
                autoFocus
              />
            </div>

            <div className="admin-collection-field">
              <label
                htmlFor="collection-description"
              >
                Description
              </label>

              <textarea
                id="collection-description"
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                rows={6}
                placeholder="Describe this collection"
              />
            </div>
          </section>

          <section className="admin-collection-editor-card">
            <div className="admin-collection-card-heading">
              <div>
                <h2>
                  Products
                </h2>

                <p>
                  Add products after
                  creating the collection.
                </p>
              </div>

              <button
                type="button"
                className="admin-secondary-button"
                disabled
              >
                Browse
              </button>
            </div>

            <div className="admin-collection-empty-products">
              Save this collection
              first, then you can
              browse and add products.
            </div>
          </section>

          <section className="admin-collection-editor-card">
            <div className="admin-collection-card-heading">
              <div>
                <h2>
                  Search engine listing
                </h2>

                <p>
                  Customize how this
                  collection appears in
                  search results.
                </p>
              </div>
            </div>

            <div className="admin-collection-seo-preview">
              <div className="admin-collection-seo-title">
                {previewTitle}
              </div>

              <div className="admin-collection-seo-url">
                https://sparesco.com/collections/
                {effectiveHandle ||
                  "collection-handle"}
              </div>

              {previewDescription ? (
                <div className="admin-collection-seo-description">
                  {previewDescription}
                </div>
              ) : null}
            </div>

            <div className="admin-collection-field">
              <label
                htmlFor="collection-seo-title"
              >
                Page title
              </label>

              <input
                id="collection-seo-title"
                type="text"
                value={seoTitle}
                onChange={(event) =>
                  setSeoTitle(
                    event.target.value
                  )
                }
                placeholder={
                  title ||
                  "Collection title"
                }
              />

              <span className="admin-collection-field-help">
                {seoTitle.length}/70
              </span>
            </div>

            <div className="admin-collection-field">
              <label
                htmlFor="collection-seo-description"
              >
                Meta description
              </label>

              <textarea
                id="collection-seo-description"
                value={
                  seoDescription
                }
                onChange={(event) =>
                  setSeoDescription(
                    event.target.value
                  )
                }
                rows={4}
                placeholder="Add a description for search engines"
              />

              <span className="admin-collection-field-help">
                {
                  seoDescription.length
                }
                /160
              </span>
            </div>

            <div className="admin-collection-field">
              <label
                htmlFor="collection-handle"
              >
                URL handle
              </label>

              <div className="admin-collection-url-field">
                <span>
                  /collections/
                </span>

                <input
                  id="collection-handle"
                  type="text"
                  value={
                    handleEdited
                      ? handle
                      : effectiveHandle
                  }
                  onChange={(event) => {
                    setHandleEdited(
                      true
                    );

                    setHandle(
                      event.target.value
                    );
                  }}
                />
              </div>

              <span className="admin-collection-field-help">
                You can change this
                later. Changing an
                existing collection
                handle will create a
                redirect from the old
                URL.
              </span>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}