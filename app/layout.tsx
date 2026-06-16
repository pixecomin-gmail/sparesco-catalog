import type { Metadata } from "next";
import "./globals.css";

import SiteFooter from "@/components/SiteFooter";
import { EnquiryProvider } from "@/context/EnquiryContext";
import EnquiryDrawer from "@/components/EnquiryDrawer";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Sparesco | Industrial Spare Parts Catalogue",
  description:
    "Search industrial spare parts, equipment parts, filters, sensors, hydraulic parts and machinery components. Send enquiry for available products.",
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