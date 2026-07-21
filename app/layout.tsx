import type { Metadata } from "next";
import "./globals.css";

import { EnquiryProvider } from "@/context/EnquiryContext";
import LayoutShell from "@/components/LayoutShell";
import { GoogleAnalytics } from "@next/third-parties/google";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sparesco.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Sparesco | Heavy Equipment & Industrial Spare Parts Catalogue",
    template: "%s | Sparesco",
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
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
  openGraph: {
    title: "Sparesco | Heavy Equipment & Industrial Spare Parts Catalogue",
    description:
      "Find and enquire for heavy equipment, hydraulic, industrial and machinery spare parts.",
    url: siteUrl,
    siteName: "Sparesco",
    type: "website",
    images: [
      {
        url: `${siteUrl}/logo.png`,
        width: 1200,
        height: 630,
        alt: "Sparesco",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sparesco | Industrial Spare Parts Catalogue",
    description:
      "Search and enquire for heavy equipment and industrial spare parts.",
    images: [`${siteUrl}/logo.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Sparesco",
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    url: `${siteUrl}/contact`,
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Sparesco",
  url: siteUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c"),
          }}
        />

        <EnquiryProvider>
          <LayoutShell>{children}</LayoutShell>
        </EnquiryProvider>

        <GoogleAnalytics gaId="G-6T2ZWVY6G3" />
      </body>
    </html>
  );
}