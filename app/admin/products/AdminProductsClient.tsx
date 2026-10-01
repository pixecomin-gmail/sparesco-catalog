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
    const [deletingHandle, setDeletingHandle] = useState("");

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

    const deleteProduct = async (product: ProductResult) => {
        const confirmed = window.confirm(
            `Delete "${product.title}"?\n\n` +
            `Handle: ${product.handle}\n\n` +
            `This will remove the product from the catalogue, collections and search.`
        );

        if (!confirmed) {
            return;
        }

        setDeletingHandle(product.handle);
        setError("");

        try {
            const response = await fetch(
                `/api/admin/products/${encodeURIComponent(product.handle)}`,
                {
                    method: "DELETE",
                }
            );

            const contentType =
                response.headers.get("content-type") || "";

            let data: any = null;

            if (contentType.includes("application/json")) {
                data = await response.json();
            }

            if (!response.ok || !data?.success) {
                throw new Error(
                    data?.error ||
                    data?.message ||
                    `Unable to delete product (${response.status}).`
                );
            }

            setProducts((current) =>
                current.filter(
                    (item) => item.handle !== product.handle
                )
            );

            alert(`"${product.title}" deleted successfully.`);
        } catch (error) {
            console.error("Delete product error:", error);

            setError(
                error instanceof Error
                    ? error.message
                    : "Unable to delete product."
            );
        } finally {
            setDeletingHandle("");
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
                                {products.map((product) => {
                                    const isDeleting =
                                        deletingHandle === product.handle;

                                    return (
                                        <tr key={product.handle}>
                                            <td>
                                                <div className="admin-product-name-cell">
                                                    {product.image ? (
                                                        <img
                                                            src={getCatalogThumbnailUrl({
                                                                image: product.image,
                                                                collection:
                                                                    product.collection,
                                                            })}
                                                            alt=""
                                                            className="admin-product-thumb"
                                                        />
                                                    ) : (
                                                        <div className="admin-product-thumb-placeholder" />
                                                    )}

                                                    <div>
                                                        <strong>
                                                            {product.title}
                                                        </strong>

                                                        <span>
                                                            {product.handle}
                                                        </span>
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
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "flex-end",
                                                        gap: 12,
                                                    }}
                                                >
                                                    <Link
                                                        href={`/admin/products/${product.handle}`}
                                                        className="admin-edit-link"
                                                    >
                                                        Edit
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            deleteProduct(product)
                                                        }
                                                        disabled={
                                                            Boolean(
                                                                deletingHandle
                                                            )
                                                        }
                                                        style={{
                                                            border: 0,
                                                            padding: 0,
                                                            background:
                                                                "transparent",
                                                            color: "#b42318",
                                                            font: "inherit",
                                                            fontWeight: 600,
                                                            cursor: isDeleting
                                                                ? "wait"
                                                                : "pointer",
                                                            opacity:
                                                                deletingHandle &&
                                                                !isDeleting
                                                                    ? 0.5
                                                                    : 1,
                                                        }}
                                                    >
                                                        {isDeleting
                                                            ? "Deleting..."
                                                            : "Delete"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}