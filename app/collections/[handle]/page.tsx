export const runtime = "edge";

import { Suspense } from "react";
import CollectionPageClient from "@/components/CollectionPageClient";

export default function CollectionPage() {
  return (
    <Suspense fallback={null}>
      <CollectionPageClient />
    </Suspense>
  );
}