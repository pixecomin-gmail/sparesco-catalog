"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { getCatalogThumbnailUrl } from "@/lib/catalog/thumbnail";

type ProductResult = {
    handle: string;
    title: string;
    collection: string;
    collectionTitle: string;
    category: string;
    categoryTitle: string;
    image: string;
    partNumber: string;
    vendor: string;
    variantCount: number;
    price: number;
};

export default function AdminProductsClient() {
    const [query, setQuery] = useState("");
    const [products, setProducts] = useState<ProductResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState("");

    const searchProducts = async (event: FormEvent) => {
        event.preventDefault();

        const value = query.trim();

        if (value.length < 2) {
            setError("Enter at least 2 characters.");
            setProducts([]);
            setSearched(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                `/api/search?q=${encodeURIComponent(value)}`
            );

            if (!response.ok) {
                throw new Error("Unable to search products.");
            }

            const data = (await response.json()) as ProductResult[];

            setProducts(data);
            setSearched(true);
        } catch {
            setProducts([]);
            setSearched(true);
            setError("Unable to search products.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <form
                className="admin-product-search"
                onSubmit={searchProducts}
            >
                <input
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by product name, part number or brand..."
                    className="admin-product-search-input"
                />

                <button
                    type="submit"
                    className="admin-primary-button"
                    disabled={loading}
                >
                    {loading ? "Searching..." : "Search"}
                </button>
            </form>

            {error && (
                <div className="admin-form-error">
                    {error}
                </div>
            )}

            {!searched && (
                <div className="admin-product-empty">
                    Search for a product to begin.
                </div>
            )}

            {searched && !loading && products.length === 0 && !error && (
                <div className="admin-product-empty">
                    No products found.
                </div>
            )}

            {products.length > 0 && (
                <>
                    <div className="admin-product-results-summary">
                        {products.length} product
                        {products.length === 1 ? "" : "s"} found
                    </div>

                    <div className="admin-product-table-wrap">
                        <table className="admin-product-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Part Number</th>
                                    <th>Brand</th>
                                    <th>Collection</th>
                                    <th>Variants</th>
                                    <th></th>
                                </tr>
                            </thead>

                            <tbody>
                                {products.map((product) => (
                                    <tr key={product.handle}>
                                        <td>
                                            <div className="admin-product-name-cell">
                                                {product.image ? (
                                                    <img
                                                        src={getCatalogThumbnailUrl({
                                                            image: product.image,
                                                            collection: product.collection,
                                                        })}
                                                        alt=""
                                                        className="admin-product-thumb"
                                                    />
                                                ) : (
                                                    <div className="admin-product-thumb-placeholder" />
                                                )}

                                                <div>
                                                    <strong>{product.title}</strong>

                                                    <span>{product.handle}</span>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            {product.partNumber || "—"}
                                        </td>

                                        <td>
                                            {product.vendor || "—"}
                                        </td>

                                        <td>
                                            {product.collectionTitle ||
                                                product.collection ||
                                                "—"}
                                        </td>

                                        <td>
                                            {product.variantCount || 1}
                                        </td>

                                        <td className="admin-product-action-cell">
                                            <Link
                                                href={`/admin/products/${product.handle}`}
                                                className="admin-edit-link"
                                            >
                                                Edit
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}