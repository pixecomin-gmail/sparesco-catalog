export const runtime = "edge";

import type { Metadata } from "next";
import { Suspense } from "react";
import CollectionPageClient from "@/components/CollectionPageClient";

type Props = {
  params: Promise<{ handle: string }>;
};

function cleanTitle(handle: string) {
  return handle
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { handle } = await params;
  const title = cleanTitle(handle);

  const metaTitle = `${title} Filters, Spare Parts & Cross Reference`;
  const metaDescription = `Browse ${title} filters, spare parts and cross reference products. View specifications and send enquiries to Sparesco.`;
  const canonical = `/collections/${handle}`;

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${metaTitle} | Sparesco`,
      description: metaDescription,
      url: canonical,
      siteName: "Sparesco",
      type: "website",
      images: [
        {
          url: "/logo.png",
          width: 1200,
          height: 630,
          alt: `${title} Spare Parts`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${metaTitle} | Sparesco`,
      description: metaDescription,
      images: ["/logo.png"],
    },
  };
}

export default function CollectionPage() {
  return (
    <Suspense fallback={null}>
      <CollectionPageClient />
    </Suspense>
  );
}