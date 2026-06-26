"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type CollectionItem = {
  title: string;
  handle: string;
  count?: number;
};

export default function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionItem[]>([]);

  useEffect(() => {
    fetch("/data/collections.json")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: CollectionItem[]) =>
        setCollections(
          data
            .filter((collection) => collection.title && collection.handle)
            .sort((a, b) => a.title.localeCompare(b.title))
        )
      )
      .catch(() => setCollections([]));
  }, []);

  return (
    <main className="collections-temp-page">
      <section className="collections-temp-hero">
        <div className="container">
          <span className="collections-temp-tag">Product Collections</span>
          <h1>Browse All Spare Parts Collections</h1>
          <p>
            Explore our complete catalogue by brand, filter type and industrial
            spare parts collection.
          </p>
        </div>
      </section>

      <section className="collections-temp-section">
        <div className="container">
          <div className="collections-temp-header">
            <h2>All Collections</h2>
            <p>{collections.length} collections available</p>
          </div>

          <div className="collections-temp-grid">
            {collections.map((collection) => (
              <Link
                key={collection.handle}
                href={`/collections/${collection.handle}`}
                className="collections-temp-card"
              >
                <div>
                  <h3>{collection.title}</h3>
                  <p>
                    {collection.count && collection.count > 0
                      ? `${collection.count.toLocaleString()} products`
                      : "View products"}
                  </p>
                </div>

                <span>View Collection →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        .collections-temp-page {
          background: var(--bg);
          min-height: 100vh;
        }

        .collections-temp-hero {
          background: linear-gradient(135deg, #173f4c 0%, #2a8392 100%);
          color: #ffffff;
          padding: 72px 0 64px;
        }

        .collections-temp-tag {
          display: inline-block;
          margin-bottom: 14px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.78);
        }

        .collections-temp-hero h1 {
          max-width: 720px;
          margin: 0 0 16px;
          font-size: 46px;
          line-height: 1.08;
          letter-spacing: -0.04em;
        }

        .collections-temp-hero p {
          max-width: 620px;
          margin: 0;
          font-size: 18px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.82);
        }

        .collections-temp-section {
          padding: 52px 0 72px;
        }

        .collections-temp-header {
          margin-bottom: 24px;
        }

        .collections-temp-header h2 {
          margin: 0 0 6px;
          color: var(--primary);
          font-size: 30px;
        }

        .collections-temp-header p {
          margin: 0;
          color: #6b7280;
          font-size: 15px;
        }

        .collections-temp-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
        }

        .collections-temp-card {
          display: flex;
          min-height: 150px;
          flex-direction: column;
          justify-content: space-between;
          gap: 24px;
          padding: 22px;
          border: 1px solid var(--border);
          border-radius: 14px;
          background: #ffffff;
          color: inherit;
          text-decoration: none;
          box-shadow: 0 8px 24px rgba(23, 63, 76, 0.06);
          transition: all 0.2s ease;
        }

        .collections-temp-card:hover {
          transform: translateY(-3px);
          border-color: var(--accent);
          box-shadow: 0 16px 36px rgba(23, 63, 76, 0.14);
        }

        .collections-temp-card h3 {
          margin: 0 0 10px;
          color: var(--primary);
          font-size: 19px;
          line-height: 1.25;
        }

        .collections-temp-card p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .collections-temp-card span {
          color: var(--accent);
          font-size: 14px;
          font-weight: 700;
        }

        @media (max-width: 1024px) {
          .collections-temp-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .collections-temp-hero {
            padding: 52px 0;
          }

          .collections-temp-hero h1 {
            font-size: 34px;
          }

          .collections-temp-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 520px) {
          .collections-temp-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}