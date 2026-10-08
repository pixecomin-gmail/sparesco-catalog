"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

type CollectionItem = {
  title: string;
  handle: string;
  count: number;
};

export default function AdminCollectionsPage() {
  const [
    collections,
    setCollections,
  ] = useState<CollectionItem[]>([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCollections() {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            "/api/admin/collections",
            {
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              data?.error ||
              "Unable to load collections."
          );
        }

        if (!cancelled) {
          setCollections(
            Array.isArray(
              data?.collections
            )
              ? data.collections
              : []
          );
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load collections."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCollections();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCollections =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return collections;
      }

      return collections.filter(
        (collection) =>
          collection.title
            .toLowerCase()
            .includes(query) ||
          collection.handle
            .toLowerCase()
            .includes(query)
      );
    }, [
      collections,
      search,
    ]);

  return (
    <main className="admin-dashboard">
      <div className="admin-page-heading">
        <div>
          <h1>Collections</h1>

          <p>
            Organize products into
            collections.
          </p>
        </div>

        <Link
          href="/admin/collections/new"
          className="admin-primary-button"
        >
          Create collection
        </Link>
      </div>

      <section className="admin-collections-card">
        <div className="admin-collections-toolbar">
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search collections"
            className="admin-collections-search"
          />
        </div>

        {loading ? (
          <div className="admin-collections-state">
            Loading collections...
          </div>
        ) : error ? (
          <div className="admin-collections-state admin-collections-error">
            {error}
          </div>
        ) : filteredCollections.length ===
          0 ? (
          <div className="admin-collections-state">
            {search.trim()
              ? "No collections match your search."
              : "No collections found."}
          </div>
        ) : (
          <div className="admin-collections-table-wrap">
            <table className="admin-collections-table">
              <thead>
                <tr>
                  <th>
                    Collection
                  </th>

                  <th>
                    Products
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredCollections.map(
                  (collection) => (
                    <tr
                      key={
                        collection.handle
                      }
                    >
                      <td>
                        <Link
                          href={`/admin/collections/${encodeURIComponent(
                            collection.handle
                          )}`}
                          prefetch={false}
                          className="admin-collection-link"
                        >
                          <strong>
                            {
                              collection.title
                            }
                          </strong>

                          <span>
                            /collections/
                            {
                              collection.handle
                            }
                          </span>
                        </Link>
                      </td>

                      <td className="admin-collection-count">
                        {Number(
                          collection.count ||
                            0
                        ).toLocaleString()}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}