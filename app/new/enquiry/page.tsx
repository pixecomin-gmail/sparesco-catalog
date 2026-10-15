"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Item = { id?: string; handle: string; title: string; sku?: string; partNumber?: string; variantDescription?: string; image?: string; vendor?: string; price?: number; quantity: number };
const KEY = "sparesco-v2-enquiry";
function readItems(): Item[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(data) ? data.filter((item): item is Item => Boolean(item && typeof item === "object" && typeof item.handle === "string")) : [];
  } catch { return []; }
}
export default function Page() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    const refresh = () => setItems(readItems());
    refresh();
    window.addEventListener("sparesco-v2-enquiry-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener("sparesco-v2-enquiry-updated", refresh); window.removeEventListener("storage", refresh); };
  }, []);
  function update(next: Item[]) {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      setItems(next);
      window.dispatchEvent(new Event("sparesco-v2-enquiry-updated"));
    } catch { window.alert("Unable to save the enquiry list in this browser."); }
  }
  return <main className="container" style={{ paddingTop: 28, paddingBottom: 80 }}>
    <h1>Enquiry List</h1>
    <p>This is a V2 test list. Sending real enquiries is disabled.</p>
    <div className="v2panel">
      {items.length ? items.map((item, index) => <div className="v2enquiryRow" key={`${item.handle}-${item.partNumber || item.sku || index}`}>
        {item.image ? <img src={item.image} alt="" style={{ width: 72, height: 72, objectFit: "contain" }} /> : null}
        <div>
          <Link href={`/new/products/${encodeURIComponent(item.handle)}`}><strong>{item.partNumber || item.sku || item.title}</strong></Link>
          <p>{item.title}</p>
          {item.variantDescription ? <p>{item.variantDescription}</p> : null}
        </div>
        <input aria-label="Quantity" type="number" min={1} value={item.quantity || 1} onChange={event => update(items.map((value, i) => i === index ? { ...value, quantity: Math.max(1, Number(event.target.value) || 1) } : value))} />
        <button type="button" onClick={() => update(items.filter((_, i) => i !== index))}>Remove</button>
      </div>) : <p>No products added yet. <Link href="/new/search">Browse products</Link>.</p>}
    </div>
  </main>;
}
