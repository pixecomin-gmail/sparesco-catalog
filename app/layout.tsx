import type { Metadata } from "next";
import "./globals.css";

import SiteFooter from "@/components/SiteFooter";
import { EnquiryProvider } from "@/context/EnquiryContext";
import EnquiryDrawer from "@/components/EnquiryDrawer";
import SiteHeader from "@/components/SiteHeader";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Sparesco | Heavy Equipment & Industrial Spare Parts Catalogue",
    template: "%s | Sparesco",
  },
  description:
    "Search heavy equipment spare parts, industrial filters, hydraulic components, machinery parts and replacement spares. Send product enquiries directly to Sparesco.",
  keywords: [
    "heavy equipment spare parts",
    "industrial spare parts",
    "machinery spare parts",
    "hydraulic filters",
    "air filters",
    "replacement parts",
    "construction equipment parts",
    "mining equipment parts",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Sparesco | Heavy Equipment & Industrial Spare Parts Catalogue",
    description:
      "Find and enquire for heavy equipment, hydraulic, industrial and machinery spare parts.",
    url: siteUrl,
    siteName: "Sparesco",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sparesco | Industrial Spare Parts Catalogue",
    description:
      "Search and enquire for heavy equipment and industrial spare parts.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <EnquiryProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
          <EnquiryDrawer />
        </EnquiryProvider>
      </body>
    </html>
  );
}