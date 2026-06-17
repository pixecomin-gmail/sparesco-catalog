import Link from "next/link";
import { getCategories, getAllProducts } from "@/lib/products";

const categories = getCategories();
const products = getAllProducts();

function getCategoryCount(category: string) {
  return products.filter((product) => product.category === category).length;
}

export default function CollectionsPage() {
  return (
    <main>
      <section className="section">
        <div className="container">
          <h1 className="page-title">All Collections</h1>
          <p className="page-intro">
            Browse spare parts by collection and product category.
          </p>

          <div className="category-grid collections-page-grid">
            {categories.map((category) => (
              <Link
                key={category}
                href={`/collections/${category.toLowerCase().replaceAll(" ", "-")}`}
                className="category-card collection-page-card"
              >
                <span>{category}</span>
                <small>{getCategoryCount(category)} products</small>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}