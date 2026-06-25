"use client";

import { useMemo, useState } from "react";
import { collectionSections, featuredCollections, sidebarGroups } from "@/data/collections-hub";
import "./CollectionsHub.css";

const filterTabs = ["All", ...collectionSections.map((section) => section.title)];

export default function CollectionsHub() {
  const [activeTab, setActiveTab] = useState("All");
  const [openSections, setOpenSections] = useState<string[]>(
    collectionSections.map((section) => section.title)
  );

  const visibleSections = useMemo(() => {
    if (activeTab === "All") return collectionSections;
    return collectionSections.filter((section) => section.title === activeTab);
  }, [activeTab]);

  function handleTabClick(tab: string) {
    setActiveTab(tab);
    setOpenSections(
      tab === "All" ? collectionSections.map((section) => section.title) : [tab]
    );
  }

  function toggleSection(title: string) {
    setOpenSections((current) =>
      current.includes(title)
        ? current.filter((item) => item !== title)
        : [...current, title]
    );
  }

  return (
    <section className="collections-hub">
      <div className="container">
        <div className="collections-page-header">
          <h1>All Categories</h1>
          <p>Browse 35 specialized collections across construction, mining, power systems and industrial equipment.</p>
        </div>

        <div className="collections-filter-bar" role="tablist" aria-label="Collection categories">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`collections-filter-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => handleTabClick(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="collections-main-layout">
          <aside className="collections-sidebar">
            {sidebarGroups.map((group) => (
              <div className="collections-sidebar-section" key={group.title}>
                <div className="collections-sidebar-title">{group.title}</div>
                {group.items.map((item) => (
                  <a href={item.href} className="collections-sidebar-link" key={item.name}>
                    {item.name} <span className="count">{item.count}</span>
                  </a>
                ))}
              </div>
            ))}
          </aside>

          <div className="collections-content">
            <div className="collections-section-header collections-section-header-static">
              <h2 className="collections-section-title">Featured Collections</h2>
            </div>

            <div className="collections-featured-row">
              {featuredCollections.map((item) => (
                <a href={item.href} className="collections-featured-card" key={item.title}>
                  <div
                    className="collections-featured-icon"
                    dangerouslySetInnerHTML={{ __html: item.svg }}
                  />
                  <div>
                    <div className="collections-featured-title">{item.title}</div>
                    <div className="collections-featured-desc">{item.description}</div>
                  </div>
                </a>
              ))}
            </div>

            {visibleSections.map((section) => {
              const isOpen = openSections.includes(section.title);

              return (
                <div className="collections-category-section" key={section.title}>
                  <button
                    type="button"
                    className="collections-section-header"
                    onClick={() => toggleSection(section.title)}
                  >
                    <h2 className="collections-section-title">
                      {section.title} <span className="collections-section-count">({section.count} collections)</span>
                    </h2>
                    <span className={`collections-accordion-icon ${isOpen ? "open" : ""}`}>⌄</span>
                  </button>

                  {isOpen && (
                    <div className="collections-category-grid">
                      {section.collections.map((item) => (
                        <a href={item.href} className="collections-cat-card" key={item.name}>
                          <div
                            className="collections-cat-icon"
                            dangerouslySetInnerHTML={{ __html: item.svg }}
                          />
                          <div className="collections-cat-info">
                            <div className="collections-cat-name">{item.name}</div>
                            <div className="collections-cat-meta">{item.meta}</div>
                          </div>
                          <span className="collections-cat-arrow">›</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
