"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCatalogThumbnailUrl } from "@/lib/catalog/thumbnail";

type ProductVariant = {
    title: string;
    option1Value?: string;
    image?: string;
    vendor?: string;
    price?: number;
    partNumber?: string;
    hsCode?: string;
    countryOfOrigin?: string;
    description?: string;
    specifications?: string[];
    unitWeight?: string;
    shippingVolume?: string;
};

type ProductSource = {
    collectionHandle?: string;
    collectionName?: string;
    excelFile?: string;
    sourceRow?: number;
    rawHandle?: string;
    rawPartNumber?: string;
    canonicalKey?: string;
};

type Product = {
    handle: string;
    canonicalKey?: string;
    title: string;
    collection: string;
    category: string;
    imageFolder?: string;
    tags: string[];
    images: string[];
    variants: ProductVariant[];
    sources?: ProductSource[];
};

export default function EditProductClient({
    handle,
}: {
    handle: string;
}) {
    const [product, setProduct] =
        useState<Product | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [openVariants, setOpenVariants] =
        useState<number[]>([0]);

    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");
    const [saveError, setSaveError] = useState("");

    useEffect(() => {
        async function loadProduct() {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `/api/product/${encodeURIComponent(handle)}`
                );

                if (!response.ok) {
                    throw new Error(
                        "Unable to load product."
                    );
                }

                const data =
                    (await response.json()) as Product;

                setProduct(data);
            } catch {
                setError(
                    "Unable to load product."
                );
            } finally {
                setLoading(false);
            }
        }

        loadProduct();
    }, [handle]);

    function updateProduct<
        K extends keyof Product
    >(
        field: K,
        value: Product[K]
    ) {
        setProduct((current) => {
            if (!current) return current;

            return {
                ...current,
                [field]: value,
            };
        });
    }

    function updateVariant(
        index: number,
        field: keyof ProductVariant,
        value: string | number | string[]
    ) {
        setProduct((current) => {
            if (!current) return current;

            const variants =
                current.variants.map(
                    (variant, variantIndex) =>
                        variantIndex === index
                            ? {
                                ...variant,
                                [field]: value,
                            }
                            : variant
                );

            return {
                ...current,
                variants,
            };
        });
    }

    function toggleVariant(
        index: number
    ) {
        setOpenVariants((current) =>
            current.includes(index)
                ? current.filter(
                    (item) => item !== index
                )
                : [...current, index]
        );
    }

    if (loading) {
        return (
            <main className="admin-dashboard">
                <div className="admin-product-empty">
                    Loading product...
                </div>
            </main>
        );
    }

    if (error || !product) {
        return (
            <main className="admin-dashboard">
                <div className="admin-form-error">
                    {error || "Product not found."}
                </div>
            </main>
        );
    }

    async function saveProduct() {
        if (!product || saving) return;

        const confirmed = window.confirm(
            `Save changes to ${product.title || product.handle}?`
        );

        if (!confirmed) return;

        setSaving(true);
        setSaveMessage("");
        setSaveError("");

        try {
            const response = await fetch(
                `/api/admin/products/${encodeURIComponent(product.handle)}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(product),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.error || "Unable to save product."
                );
            }

            if (data.product) {
                setProduct(data.product);
            }

            setSaveMessage("Product saved successfully.");
        } catch (error) {
            setSaveError(
                error instanceof Error
                    ? error.message
                    : "Unable to save product."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="admin-dashboard">
            <div className="admin-page-heading admin-edit-heading">
                <div>
                    <Link
                        href="/admin/products"
                        className="admin-back-link"
                    >
                        ← Products
                    </Link>

                    <h1>Edit Product</h1>

                    <p>
                        {product.title}
                    </p>
                </div>

                <button
                    type="button"
                    className="admin-primary-button"
                    onClick={saveProduct}
                    disabled={saving || !product}
                >
                    {saving ? "Saving..." : "Save Product"}
                </button>

                {saveMessage && (
                    <p className="admin-save-success">
                        {saveMessage}
                    </p>
                )}

                {saveError && (
                    <p className="admin-save-error">
                        {saveError}
                    </p>
                )}

            </div>

            <section className="admin-edit-card">
                <h2>Product</h2>

                <div className="admin-form-grid">
                    <div className="admin-field">
                        <label>Title</label>

                        <input
                            value={product.title}
                            onChange={(e) =>
                                updateProduct(
                                    "title",
                                    e.target.value
                                )
                            }
                        />
                    </div>

                    <div className="admin-field">
                        <label>
                            Handle
                        </label>

                        <input
                            value={product.handle}
                            readOnly
                            className="admin-readonly-input"
                        />
                    </div>

                    <div className="admin-field">
                        <label>
                            Collection
                        </label>

                        <input
                            value={product.collection}
                            onChange={(e) =>
                                updateProduct(
                                    "collection",
                                    e.target.value
                                )
                            }
                        />
                    </div>

                    <div className="admin-field">
                        <label>
                            Category
                        </label>

                        <input
                            value={product.category}
                            onChange={(e) =>
                                updateProduct(
                                    "category",
                                    e.target.value
                                )
                            }
                        />
                    </div>

                    <div className="admin-field admin-field-full">
                        <label>
                            Tags
                        </label>

                        <input
                            value={product.tags.join(", ")}
                            onChange={(e) =>
                                updateProduct(
                                    "tags",
                                    e.target.value
                                        .split(",")
                                        .map((tag) =>
                                            tag.trim()
                                        )
                                        .filter(Boolean)
                                )
                            }
                            placeholder="tag-one, tag-two"
                        />
                    </div>
                </div>
            </section>

            <section className="admin-edit-card">
                <h2>
                    Images ({product.images.length})
                </h2>

                <div className="admin-edit-images">
                    {product.images.map(
                        (image, index) => (
                            <div
                                key={`${image}-${index}`}
                                className="admin-edit-image-card"
                            >
                                <img
                                    src={getCatalogThumbnailUrl({
                                        image,
                                        imageFolder:
                                            product.imageFolder,
                                        collection:
                                            product.collection,
                                    })}
                                    alt=""
                                />

                                <span>
                                    {image}
                                </span>
                            </div>
                        )
                    )}
                </div>
            </section>

            <section className="admin-edit-card">
                <h2>
                    Variants ({product.variants.length})
                </h2>

                <div className="admin-variant-list">
                    {product.variants.map(
                        (variant, index) => {
                            const isOpen =
                                openVariants.includes(
                                    index
                                );

                            return (
                                <div
                                    className="admin-variant-card"
                                    key={index}
                                >
                                    <button
                                        type="button"
                                        className="admin-variant-header"
                                        onClick={() =>
                                            toggleVariant(index)
                                        }
                                    >
                                        <div>
                                            <strong>
                                                {variant.title ||
                                                    `Variant ${index + 1}`}
                                            </strong>

                                            <span>
                                                {variant.partNumber ||
                                                    "No part number"}
                                            </span>
                                        </div>

                                        <span>
                                            {isOpen
                                                ? "−"
                                                : "+"}
                                        </span>
                                    </button>

                                    {isOpen && (
                                        <div className="admin-variant-body">
                                            {variant.image && (
                                                <div className="admin-variant-image-row">
                                                    <img
                                                        src={getCatalogThumbnailUrl({
                                                            image:
                                                                variant.image,
                                                            imageFolder:
                                                                product.imageFolder,
                                                            collection:
                                                                product.collection,
                                                        })}
                                                        alt=""
                                                    />

                                                    <span>
                                                        {variant.image}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="admin-form-grid">
                                                <div className="admin-field admin-field-full">
                                                    <label>
                                                        Variant Title
                                                    </label>

                                                    <input
                                                        value={
                                                            variant.title ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            updateVariant(
                                                                index,
                                                                "title",
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="admin-field admin-field-full">
                                                    <label>
                                                        Option Title
                                                    </label>

                                                    <input
                                                        value={
                                                            variant.option1Value ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            updateVariant(
                                                                index,
                                                                "option1Value",
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="admin-field">
                                                    <label>
                                                        Part Number
                                                    </label>

                                                    <input
                                                        value={
                                                            variant.partNumber ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            updateVariant(
                                                                index,
                                                                "partNumber",
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="admin-field">
                                                    <label>
                                                        Price
                                                    </label>

                                                    <input
                                                        type="number"
                                                        value={
                                                            variant.price ??
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            updateVariant(
                                                                index,
                                                                "price",
                                                                e.target
                                                                    .value ===
                                                                    ""
                                                                    ? 0
                                                                    : Number(
                                                                        e
                                                                            .target
                                                                            .value
                                                                    )
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="admin-field">
                                                    <label>
                                                        Vendor / Brand
                                                    </label>

                                                    <input
                                                        value={
                                                            variant.vendor ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            updateVariant(
                                                                index,
                                                                "vendor",
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="admin-field">
                                                    <label>
                                                        Country of Origin
                                                    </label>

                                                    <input
                                                        value={
                                                            variant.countryOfOrigin ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            updateVariant(
                                                                index,
                                                                "countryOfOrigin",
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="admin-field">
                                                    <label>
                                                        HS Code
                                                    </label>

                                                    <input
                                                        value={
                                                            variant.hsCode ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            updateVariant(
                                                                index,
                                                                "hsCode",
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="admin-field">
                                                    <label>
                                                        Unit Weight
                                                    </label>

                                                    <input
                                                        value={
                                                            variant.unitWeight ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            updateVariant(
                                                                index,
                                                                "unitWeight",
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="admin-field">
                                                    <label>
                                                        Shipping Volume
                                                    </label>

                                                    <input
                                                        value={
                                                            variant.shippingVolume ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            updateVariant(
                                                                index,
                                                                "shippingVolume",
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="admin-field admin-field-full">
                                                    <label>
                                                        Description
                                                    </label>

                                                    <textarea
                                                        rows={6}
                                                        value={
                                                            variant.description ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            updateVariant(
                                                                index,
                                                                "description",
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="admin-field admin-field-full">
                                                    <label>
                                                        Specifications
                                                    </label>

                                                    <textarea
                                                        rows={5}
                                                        value={(
                                                            variant.specifications ||
                                                            []
                                                        ).join("\n")}
                                                        onChange={(e) =>
                                                            updateVariant(
                                                                index,
                                                                "specifications",
                                                                e.target.value
                                                                    .split(
                                                                        "\n"
                                                                    )
                                                                    .map(
                                                                        (
                                                                            item
                                                                        ) =>
                                                                            item.trim()
                                                                    )
                                                                    .filter(
                                                                        Boolean
                                                                    )
                                                            )
                                                        }
                                                    />

                                                    <small>
                                                        One specification per
                                                        line.
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        }
                    )}
                </div>
            </section>

            <section className="admin-edit-card">
                <h2>
                    Source Information
                </h2>

                <p className="admin-section-note">
                    Internal import information.
                    Read only.
                </p>

                <div className="admin-source-list">
                    {(product.sources || []).map(
                        (source, index) => (
                            <div
                                key={index}
                                className="admin-source-row"
                            >
                                <strong>
                                    {source.collectionName ||
                                        source.collectionHandle ||
                                        "Source"}
                                </strong>

                                <span>
                                    {source.excelFile ||
                                        "—"}
                                </span>

                                <span>
                                    Row{" "}
                                    {source.sourceRow ??
                                        "—"}
                                </span>

                                <span>
                                    {source.rawPartNumber ||
                                        "—"}
                                </span>
                            </div>
                        )
                    )}
                </div>
            </section>
        </main>
    );
}