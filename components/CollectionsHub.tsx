"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collectionSections, featuredCollections } from "@/data/collections-hub";
import "./CollectionsHub.css";

type ApiCollection = {
  title: string;
  handle: string;
  count: number;
};

type CollectionsHubProps = {
  initialCollections?: ApiCollection[];
};

const CATEGORY_MAP: Record<string, string[]> = {
  Filters: [
    "air-filters",
    "compressed-air-filters",
    "hydraulic-filters",
    "oil-filters",
    "process-filters",
    "filterfinder",
    "granch-filtration",
  ],
  Brands: [
    "donaldson",
    "fleetguard",
    "hengst",
    "hifi-filter",
    "mahle",
    "mann-filter",
    "sf-filter",
    "ufi",
  ],
  "Hydraulic Brands": [
    "argo-hytos",
    "eppensteiner",
    "fairey-arlon",
    "filtrec",
    "hy-pro",
    "hydac",
    "ikron",
    "internormen",
    "mp-filtri",
    "omt",
    "pall",
    "parker",
    "rexroth",
    "schroeder",
    "sofima",
    "stauff",
  ],
  Industrial: [
    "domnick-hunter",
    "filtration-group",
    "microfit",
    "parker-ucc",
  ],
};

function getSvg(handle: string) {
  for (const section of collectionSections) {
    const match = section.collections.find((item) =>
      item.href.endsWith(`/${handle}`)
    );

    if (match?.svg) return match.svg;
  }

  return '<svg fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 40 40"><rect height="24" rx="3" width="24" x="8" y="8"></rect><line x1="14" x2="26" y1="16" y2="16"></line><line x1="14" x2="24" y1="22" y2="22"></line><line x1="14" x2="20" y1="28" y2="28"></line></svg>';
}

export default function CollectionsHub({
  initialCollections = [],
}: CollectionsHubProps) {
  const [apiCollections, setApiCollections] =
    useState<ApiCollection[]>(initialCollections);

  const [activeTab, setActiveTab] = useState("All");
  const hasInitialCollections = initialCollections.length > 0;

  useEffect(() => {
    if (hasInitialCollections) return;

    async function loadCollections() {
      try {
        const res = await fetch("/api/collections", { cache: "no-store" });
        const data = res.ok ? ((await res.json()) as ApiCollection[]) : [];
        setApiCollections(data);
      } catch {
        setApiCollections([]);
      }
    }

    loadCollections();
  }, [hasInitialCollections]);

  const autoSections = useMemo(() => {
    const byHandle = new Map(apiCollections.map((item) => [item.handle, item]));
    const used = new Set<string>();

    const sections = Object.entries(CATEGORY_MAP)
      .map(([title, handles]) => {
        const collections = handles
          .map((handle) => {
            const live = byHandle.get(handle);
            if (!live) return null;

            used.add(handle);

            return {
              name: live.title,
              href: `/collections/${live.handle}`,
              meta: `${live.count.toLocaleString("en-IN")} products`,
              count: live.count,
              svg: getSvg(live.handle),
            };
          })
          .filter(Boolean) as {
          name: string;
          href: string;
          meta: string;
          count: number;
          svg: string;
        }[];

        return {
          title,
          count: collections.length,
          collections,
        };
      })
      .filter((section) => section.collections.length > 0);

    const other = apiCollections.filter((item) => !used.has(item.handle));

    if (other.length > 0) {
      sections.push({
        title: "Other Collections",
        count: other.length,
        collections: other.map((item) => ({
          name: item.title,
          href: `/collections/${item.handle}`,
          meta: `${item.count.toLocaleString("en-IN")} products`,
          count: item.count,
          svg: getSvg(item.handle),
        })),
      });
    }

    return sections;
  }, [apiCollections]);

  const filterTabs = ["All", ...autoSections.map((section) => section.title)];

  const visibleSections =
    activeTab === "All"
      ? autoSections
      : autoSections.filter((section) => section.title === activeTab);

  return (
    <section className="collections-hub">
      <div className="container">
        <div className="collections-page-header">
          <h1>All Categories</h1>
          <p>
            Browse {apiCollections.length || 35} specialized collections across
            construction, mining, power systems and industrial equipment.
          </p>
        </div>

        <div className="collections-filter-bar" role="tablist">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`collections-filter-btn ${
                activeTab === tab ? "active" : ""
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="collections-main-layout">
          <aside className="collections-sidebar">
            {autoSections.map((section) => (
              <div className="collections-sidebar-section" key={section.title}>
                <button
                  type="button"
                  className={`collections-sidebar-title collections-sidebar-title-button ${
                    activeTab === section.title ? "active" : ""
                  }`}
                  onClick={() => setActiveTab(section.title)}
                >
                  {section.title}
                </button>

                {section.collections.map((item) => (
                  <Link
                    href={item.href}
                    className="collections-sidebar-link"
                    key={item.href}
                  >
                    {item.name}
                    <span className="count">{item.count}</span>
                  </Link>
                ))}
              </div>
            ))}
          </aside>

          <div className="collections-content">
            <div className="collections-section-header collections-section-header-static">
              <h2 className="collections-section-title">
                Featured Collections
              </h2>
            </div>

            <div className="collections-featured-row">
              {featuredCollections.map((item) => (
                <Link
                  href={item.href}
                  className="collections-featured-card"
                  key={item.title}
                >
                  <div
                    className="collections-featured-icon"
                    dangerouslySetInnerHTML={{ __html: item.svg }}
                  />
                  <div>
                    <div className="collections-featured-title">
                      {item.title}
                    </div>
                    <div className="collections-featured-desc">
                      {item.description}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {visibleSections.map((section) => (
              <div className="collections-category-section" key={section.title}>
                <div className="collections-section-header collections-section-header-static">
                  <h2 className="collections-section-title">
                    {section.title}
                    <span className="collections-section-count">
                      ({section.count} collections)
                    </span>
                  </h2>
                </div>

                <div className="collections-category-grid">
                  {section.collections.map((item) => (
                    <Link
                      href={item.href}
                      className="collections-cat-card"
                      key={item.href}
                    >
                      <div
                        className="collections-cat-icon"
                        dangerouslySetInnerHTML={{ __html: item.svg }}
                      />
                      <div className="collections-cat-info">
                        <div className="collections-cat-name">{item.name}</div>
                        <div className="collections-cat-meta">{item.meta}</div>
                      </div>
                      <span className="collections-cat-arrow">›</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}