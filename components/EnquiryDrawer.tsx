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
    <div className="drawer-overlay">
      <div className="enquiry-drawer">
        <div className="enquiry-drawer-header">
          <h3>Enquiry List ({items.length})</h3>
          <button onClick={closeDrawer}>×</button>
        </div>

        <div className="enquiry-items">
          {items.length === 0 && <p>No products added yet.</p>}

          {items.map((item) => (
            <div className="enquiry-item" key={item.handle}>
              <div>
                <strong>{item.title}</strong>
                <span>
                  {item.brand} • {item.category}
                </span>
              </div>

              <div className="qty-control">
                <button onClick={() => decreaseQty(item.handle)}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => increaseQty(item.handle)}>+</button>
              </div>

              <button
                className="remove-button"
                onClick={() => removeItem(item.handle)}
              >
                Remove
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