"use client";

import Link from "next/link";
import {
    FormEvent,
    useMemo,
    useState,
} from "react";

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

type ExportResponse = {
    success: boolean;
    productCount?: number;
    rowCount?: number;
    rows?: Array<
        Record<
            string,
            string | number
        >
    >;
    error?: string;
};

export default function AdminProductsClient() {
    const [query, setQuery] =
        useState("");

    const [products, setProducts] =
        useState<ProductResult[]>([]);

    const [loading, setLoading] =
        useState(false);

    const [searched, setSearched] =
        useState(false);

    const [error, setError] =
        useState("");

    const [
        selectedHandles,
        setSelectedHandles,
    ] = useState<string[]>([]);

    const [
        exporting,
        setExporting,
    ] = useState(false);

    const [
        exportError,
        setExportError,
    ] = useState("");

    const allVisibleSelected =
        useMemo(() => {
            if (!products.length) {
                return false;
            }

            return products.every(
                (product) =>
                    selectedHandles.includes(
                        product.handle
                    )
            );
        }, [
            products,
            selectedHandles,
        ]);

    const searchProducts = async (
        event: FormEvent
    ) => {
        event.preventDefault();

        const value =
            query.trim();

        if (value.length < 2) {
            setError(
                "Enter at least 2 characters."
            );
            setProducts([]);
            setSelectedHandles([]);
            setSearched(false);
            return;
        }

        setLoading(true);
        setError("");
        setExportError("");

        try {
            const response =
                await fetch(
                    `/api/search?q=${encodeURIComponent(
                        value
                    )}`
                );

            if (!response.ok) {
                throw new Error(
                    "Unable to search products."
                );
            }

            const data =
                (await response.json()) as ProductResult[];

            setProducts(data);
            setSelectedHandles([]);
            setSearched(true);
        } catch {
            setProducts([]);
            setSelectedHandles([]);
            setSearched(true);
            setError(
                "Unable to search products."
            );
        } finally {
            setLoading(false);
        }
    };

    function toggleProduct(
        handle: string
    ) {
        setSelectedHandles(
            (current) => {
                if (
                    current.includes(handle)
                ) {
                    return current.filter(
                        (item) =>
                            item !== handle
                    );
                }

                return [
                    ...current,
                    handle,
                ];
            }
        );
    }

    function toggleAllVisible() {
        if (allVisibleSelected) {
            setSelectedHandles(
                (current) =>
                    current.filter(
                        (handle) =>
                            !products.some(
                                (product) =>
                                    product.handle ===
                                    handle
                            )
                    )
            );

            return;
        }

        setSelectedHandles(
            (current) =>
                Array.from(
                    new Set([
                        ...current,
                        ...products.map(
                            (product) =>
                                product.handle
                        ),
                    ])
                )
        );
    }

    async function downloadExport(
        handles?: string[]
    ) {
        setExporting(true);
        setExportError("");

        try {
            const params =
                handles &&
                handles.length > 0
                    ? `?handles=${encodeURIComponent(
                          handles.join(",")
                      )}`
                    : "";

            const response =
                await fetch(
                    `/api/admin/export${params}`
                );

            const data =
                (await response.json()) as ExportResponse;

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.error ||
                        "Unable to export products."
                );
            }

            if (
                !data.rows ||
                data.rows.length === 0
            ) {
                throw new Error(
                    "No products were available to export."
                );
            }

            const XLSX =
                await import("xlsx");

            const worksheet =
                XLSX.utils.json_to_sheet(
                    data.rows
                );

            const workbook =
                XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "Products"
            );

            const today =
                new Date()
                    .toISOString()
                    .slice(0, 10);

            const suffix =
                handles &&
                handles.length > 0
                    ? "selected"
                    : "all";

            XLSX.writeFile(
                workbook,
                `sparesco-products-${suffix}-${today}.xlsx`
            );
        } catch (error) {
            setExportError(
                error instanceof Error
                    ? error.message
                    : "Unable to export products."
            );
        } finally {
            setExporting(false);
        }
    }

    return (
        <div>
            <div className="admin-products-toolbar">
                <form
                    className="admin-product-search"
                    onSubmit={
                        searchProducts
                    }
                >
                    <input
                        type="text"
                        value={query}
                        onChange={(
                            event
                        ) =>
                            setQuery(
                                event
                                    .target
                                    .value
                            )
                        }
                        placeholder="Search by product name, part number or brand..."
                        className="admin-product-search-input"
                    />

                    <button
                        type="submit"
                        className="admin-primary-button"
                        disabled={
                            loading ||
                            exporting
                        }
                    >
                        {loading
                            ? "Searching..."
                            : "Search"}
                    </button>
                </form>

                <button
                    type="button"
                    className="admin-secondary-button"
                    disabled={
                        exporting
                    }
                    onClick={() =>
                        downloadExport()
                    }
                >
                    {exporting
                        ? "Exporting..."
                        : "Export All"}
                </button>
            </div>

            {error && (
                <div className="admin-form-error">
                    {error}
                </div>
            )}

            {exportError && (
                <div className="admin-form-error">
                    {exportError}
                </div>
            )}

            {!searched && (
                <div className="admin-product-empty">
                    Search for a product
                    to begin.
                </div>
            )}

            {searched &&
                !loading &&
                products.length ===
                    0 &&
                !error && (
                    <div className="admin-product-empty">
                        No products found.
                    </div>
                )}

            {products.length >
                0 && (
                <>
                    <div className="admin-product-results-toolbar">
                        <div className="admin-product-results-summary">
                            {
                                products.length
                            }{" "}
                            product
                            {products.length ===
                            1
                                ? ""
                                : "s"}{" "}
                            found
                        </div>

                        {selectedHandles.length >
                            0 && (
                            <div className="admin-product-selection-actions">
                                <span>
                                    {
                                        selectedHandles.length
                                    }{" "}
                                    selected
                                </span>

                                <button
                                    type="button"
                                    className="admin-primary-button"
                                    disabled={
                                        exporting
                                    }
                                    onClick={() =>
                                        downloadExport(
                                            selectedHandles
                                        )
                                    }
                                >
                                    {exporting
                                        ? "Exporting..."
                                        : `Export selected (${selectedHandles.length})`}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="admin-product-table-wrap">
                        <table className="admin-product-table">
                            <thead>
                                <tr>
                                    <th className="admin-product-checkbox-cell">
                                        <input
                                            type="checkbox"
                                            checked={
                                                allVisibleSelected
                                            }
                                            onChange={
                                                toggleAllVisible
                                            }
                                            aria-label="Select all search results"
                                        />
                                    </th>

                                    <th>
                                        Product
                                    </th>

                                    <th>
                                        Part Number
                                    </th>

                                    <th>
                                        Brand
                                    </th>

                                    <th>
                                        Collection
                                    </th>

                                    <th>
                                        Variants
                                    </th>

                                    <th />
                                </tr>
                            </thead>

                            <tbody>
                                {products.map(
                                    (
                                        product
                                    ) => {
                                        const selected =
                                            selectedHandles.includes(
                                                product.handle
                                            );

                                        return (
                                            <tr
                                                key={
                                                    product.handle
                                                }
                                                className={
                                                    selected
                                                        ? "admin-product-row-selected"
                                                        : ""
                                                }
                                            >
                                                <td className="admin-product-checkbox-cell">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            selected
                                                        }
                                                        onChange={() =>
                                                            toggleProduct(
                                                                product.handle
                                                            )
                                                        }
                                                        aria-label={`Select ${product.title}`}
                                                    />
                                                </td>

                                                <td>
                                                    <Link
                                                        href={`/admin/products/${encodeURIComponent(
                                                            product.handle
                                                        )}`}
                                                        style={{
                                                            color: "inherit",
                                                            textDecoration:
                                                                "none",
                                                        }}
                                                    >
                                                        <div className="admin-product-name-cell">
                                                            {product.image ? (
                                                                <img
                                                                    src={getCatalogThumbnailUrl(
                                                                        {
                                                                            image: product.image,
                                                                            collection:
                                                                                product.collection,
                                                                        }
                                                                    )}
                                                                    alt=""
                                                                    className="admin-product-thumb"
                                                                />
                                                            ) : (
                                                                <div className="admin-product-thumb-placeholder" />
                                                            )}

                                                            <div>
                                                                <strong>
                                                                    {
                                                                        product.title
                                                                    }
                                                                </strong>

                                                                <span>
                                                                    {
                                                                        product.handle
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </td>

                                                <td>
                                                    {product.partNumber ||
                                                        "—"}
                                                </td>

                                                <td>
                                                    {product.vendor ||
                                                        "—"}
                                                </td>

                                                <td>
                                                    {product.collectionTitle ||
                                                        product.collection ||
                                                        "—"}
                                                </td>

                                                <td>
                                                    {product.variantCount ||
                                                        1}
                                                </td>

                                                <td className="admin-product-action-cell">
                                                    <Link
                                                        href={`/admin/products/${encodeURIComponent(
                                                            product.handle
                                                        )}`}
                                                        className="admin-edit-link"
                                                    >
                                                        Open
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    }
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}