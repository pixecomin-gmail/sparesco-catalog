import ProductPageClient from "@/components/ProductPageClient";

type ProductPageProps = {
  params: Promise<{ handle: string }>;
};

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { handle } = await params;

  return <ProductPageClient handle={handle} />;
}