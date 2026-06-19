"use client";

import Link from "next/link";
import popularSpareParts from "@/data/popular-spare-parts.json";
import { getAllProducts } from "@/lib/products";
import { useEnquiry } from "@/context/EnquiryContext";

type Product = ReturnType<typeof getAllProducts>[number];

function isProduct(product: Product | undefined): product is Product {
  return Boolean(product);
}

export default function PopularSparePartsList() {
  const { addItem } = useEnquiry();
  const allProducts = getAllProducts();

  const featuredMatches: Product[] = (popularSpareParts as string[])
    .map((handle) => allProducts.find((product) => product.handle === handle))
    .filter(isProduct);

  const products: Product[] =
    featuredMatches.length > 0
      ? featuredMatches.slice(0, 5)
      : allProducts.slice(0, 5);

  return (
    <section className="popular-parts-section section">
      <div className="container">
        <div className="section-heading-row popular-parts-heading">
          <h2 className="section-title">Popular Spare Parts</h2>
          <Link href="/parts">Browse all →</Link>
        </div>

        <div className="popular-parts-list">
          {products.map((product, index) => {
            const safeProduct = product as any;

            const image =
              safeProduct.image ||
              safeProduct.images?.[0] ||
              safeProduct.variants?.[0]?.image ||
              "";

            const brand = safeProduct.collection || safeProduct.vendor || "Sparesco";

            const firstVariant = safeProduct.variants?.[0];

            return (
              <article className="popular-part-row" key={product.handle}>
                <Link
                  href={`/products/${product.handle}`}
                  className="popular-part-main"
                >
                  <div className="popular-part-image">
                    {image ? (
                      <img src={image} alt={product.title} />
                    ) : (
                      <span>Part</span>
                    )}
                  </div>

                  <div className="popular-part-info">
                    <h3>{product.title}</h3>
                  </div>
                </Link>

                <div className="popular-part-brand">{brand}</div>

                <div
                  className={
                    index === 2
                      ? "popular-stock-badge low"
                      : "popular-stock-badge"
                  }
                >
                  {index === 2 ? "Low Stock" : "In Stock"}
                </div>

                <button
                  type="button"
                  className="popular-quote-button"
                  onClick={() =>
                    addItem({
                      id: firstVariant?.partNumber
                        ? `${product.handle}-${firstVariant.partNumber}`
                        : product.handle,
                      handle: product.handle,
                      title: product.title,
                      image,
                      partNumber: firstVariant?.partNumber || product.title,
                      vendor: brand,
                      price: firstVariant?.price || 0,
                    })
                  }
                >
                  Add To Enquiry
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}