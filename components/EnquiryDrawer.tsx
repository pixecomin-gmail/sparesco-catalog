"use client";

import { useEnquiry } from "@/context/EnquiryContext";
import Link from "next/link";

export default function EnquiryDrawer() {
  const {
    items,
    isDrawerOpen,
    closeDrawer,
    increaseQty,
    decreaseQty,
    removeItem,
  } = useEnquiry();

  if (!isDrawerOpen) return null;

  return (
    <div className="drawer-overlay" onClick={closeDrawer}>
      <div className="enquiry-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="enquiry-drawer-header">
          <h3>Enquiry List ({items.length})</h3>
          <button onClick={closeDrawer}>×</button>
        </div>

        <div className="enquiry-items">
          {items.length === 0 && <p>No products added yet.</p>}

          {items.map((item) => (
            <div className="enquiry-item enquiry-item-compact" key={item.id}>
              <Link
                href={`/products/${item.handle}`}
                className="enquiry-item-image"
                onClick={closeDrawer}
              >
                {item.image ? <img src={item.image} alt={item.title} /> : null}
              </Link>

              <div className="enquiry-item-content">
                <Link
                  href={`/products/${item.handle}`}
                  className="enquiry-item-title"
                  onClick={closeDrawer}
                >
                  {item.title}
                </Link>
              </div>

              <div className="qty-control">
                <button onClick={() => decreaseQty(item.id)}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => increaseQty(item.id)}>+</button>
              </div>

              <button
                className="delete-icon-button"
                onClick={() => removeItem(item.id)}
                aria-label="Remove item"
              >
                🗑
              </button>
            </div>
          ))}
        </div>

        <Link href="/enquiry" onClick={closeDrawer}>
          <button className="continue-enquiry-button">
            Continue to Enquiry
          </button>
        </Link>
      </div>
    </div>
  );
}