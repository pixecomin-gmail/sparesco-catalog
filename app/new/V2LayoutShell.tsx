"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import "./v2.css";
export default function V2LayoutShell({children}:{children:React.ReactNode}) {
  const pathname = usePathname();
  // Root app/layout.tsx already supplies the real Sparesco header and footer.
  // Do not add a second shell or V2 CSS wrapper around the original PDP.
  if (pathname?.startsWith("/new/products/")) return <>{children}</>;
  return <div className="v2site"><main className="v2wrap">{children}</main></div>;
}
