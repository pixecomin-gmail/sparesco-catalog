"use client";

import {
    ChangeEvent,
    useEffect,
    useRef,
    useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCatalogThumbnailUrl } from "@/lib/catalog/thumbnail";

type ProductVariant = {
    id?: string;

    title: string;

    option1Name?: string;
    option1Value?: string;

    option2Name?: string;
    option2Value?: string;

    option3Name?: string;
    option3Value?: string;

    position?: number;

    sku?: string;
    barcode?: string;

    image?: string;

    weight?: number;
    weightUnit?: string;

    vendor?: string;

    price?: number;
    compareAtPrice?: number;
    cost?: number;

    taxable?: boolean;
    taxCode?: string;

    inventoryTracker?: string;
    inventoryPolicy?: string;
    inventoryQty?: number;

    requiresShipping?: boolean;
    shippingProfile?: string;

    partNumber?: string;

    hsCode?: string;
    countryOfOrigin?: string;

    description?: string;
    specifications?: string[];

    unitWeight?: string;
    shippingVolume?: string;
};

type ProductMedia = {
    src: string;
    position: number;
    altText: string;
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
    bodyHtml?: string;

    vendor?: string;
    type?: string;

    collection: string;
    category: string;

    categoryId?: string;
    categoryName?: string;

    imageFolder?: string;

    tags: string[];
    customCollections?: string[];

    status?: string;

    published?: boolean;
    publishedAt?: string;

    templateSuffix?: string;
    giftCard?: boolean;

    images: string[];
    media?: ProductMedia[];

    variants: ProductVariant[];

    sources?: ProductSource[];
};

function getOriginalImageUrl({
    image,
    imageFolder,
    collection,
}: {
    image?: string;
    imageFolder?: string;
    collection?: string;
}) {
    if (!image) return "";

    if (image.startsWith("http")) {
        return image;
    }

    const base =
        process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

    const folder =
        imageFolder ||
        collection ||
        "products";

    return `${base.replace(
        /\/$/,
        ""
    )}/catalog/images/${folder}/${image}`;
}

export default function EditProductClient({
    handle,
}: {
    handle: string;
}) {
    const router = useRouter();

    const [product, setProduct] =
        useState<Product | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [openVariants, setOpenVariants] =
        useState<number[]>([0]);

    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] =
        useState(false);
    const [saveMessage, setSaveMessage] = useState("");
    const [saveError, setSaveError] = useState("");

    const [uploadingImages, setUploadingImages] =
        useState(false);

    const [imageError, setImageError] =
        useState("");

    const productImageInputRef =
        useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        async function loadProduct() {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `/api/admin/products/${encodeURIComponent(
                        handle
                    )}`,
                    {
                        cache: "no-store",
                    }
                );

                const data =
                    await response.json();

                if (
                    !response.ok ||
                    !data.success ||
                    !data.product
                ) {
                    throw new Error(
                        data.error ||
                        "Unable to load product."
                    );
                }

                setProduct(
                    data.product as Product
                );
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
        value:
            | string
            | number
            | boolean
            | string[]
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

    async function uploadImages(
        event: ChangeEvent<HTMLInputElement>
    ) {
        const files = Array.from(
            event.target.files || []
        );

        event.target.value = "";

        if (
            files.length === 0 ||
            !product ||
            uploadingImages
        ) {
            return;
        }

        setUploadingImages(true);
        setImageError("");

        try {
            const formData = new FormData();

            for (const file of files) {
                formData.append("files", file);
            }

            formData.append(
                "imageFolder",
                product.imageFolder ||
                    product.collection
            );

            const response = await fetch(
                `/api/admin/products/${encodeURIComponent(
                    product.handle
                )}/images`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.error ||
                        "Unable to upload images."
                );
            }

            const filenames = (
                data.uploaded || []
            )
                .map(
                    (item: {
                        filename?: string;
                    }) => item.filename
                )
                .filter(Boolean) as string[];

            if (filenames.length === 0) {
                throw new Error(
                    "No images were uploaded."
                );
            }

            setProduct((current) => {
                if (!current) return current;

                return {
                    ...current,

                    images: [
                        ...new Set([
                            ...(current.images || []),
                            ...filenames,
                        ]),
                    ],
                };
            });
        } catch (error) {
            setImageError(
                error instanceof Error
                    ? error.message
                    : "Unable to upload images."
            );
        } finally {
            setUploadingImages(false);
        }
    }

    function removeProductImage(
        image: string
    ) {
        if (!product) return;

        const usedByVariants =
            product.variants.some(
                (variant) =>
                    variant.image === image
            );

        if (usedByVariants) {
            const confirmed =
                window.confirm(
                    "This image is currently assigned to one or more variants. Remove it from the product and those variants?"
                );

            if (!confirmed) return;
        }

        setProduct((current) => {
            if (!current) return current;

            return {
                ...current,

                images: current.images.filter(
                    (item) => item !== image
                ),

                variants:
                    current.variants.map(
                        (variant) =>
                            variant.image === image
                                ? {
                                      ...variant,
                                      image: "",
                                  }
                                : variant
                    ),
            };
        });
    }

    function assignImageToVariant(
        variantIndex: number,
        image: string
    ) {
        updateVariant(
            variantIndex,
            "image",
            image
        );
    }

    function removeVariantImage(
        variantIndex: number
    ) {
        updateVariant(
            variantIndex,
            "image",
            ""
        );
    }

    function assignImageToAllVariants(
        image: string
    ) {
        if (!product) return;

        const confirmed =
            window.confirm(
                "Assign this image to all variants?"
            );

        if (!confirmed) return;

        setProduct((current) => {
            if (!current) return current;

            return {
                ...current,

                variants:
                    current.variants.map(
                        (variant) => ({
                            ...variant,
                            image,
                        })
                    ),
            };
        });
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

    async function deleteCurrentProduct() {
        if (
            !product ||
            deleting ||
            saving
        ) {
            return;
        }

        const confirmed =
            window.confirm(
                `Delete "${product.title}"?\n\n` +
                    `Handle: ${product.handle}\n\n` +
                    `This permanently removes the product from ` +
                    `the catalogue, collections and search.\n\n` +
                    `This cannot be undone.`
            );

        if (!confirmed) {
            return;
        }

        setDeleting(true);
        setSaveMessage("");
        setSaveError("");

        try {
            const response =
                await fetch(
                    `/api/admin/products/${encodeURIComponent(
                        product.handle
                    )}`,
                    {
                        method: "DELETE",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        /*
                         * Send the full product as fallback
                         * information for catalogue cleanup.
                         */
                        body:
                            JSON.stringify(
                                product
                            ),
                    }
                );

            const responseText =
                await response.text();

            let data: any = {};

            if (responseText) {
                try {
                    data =
                        JSON.parse(
                            responseText
                        );
                } catch {
                    throw new Error(
                        `Delete failed with HTTP ${response.status}.`
                    );
                }
            }

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.error ||
                        data.message ||
                        "Unable to delete product."
                );
            }

            router.push(
                "/admin/products"
            );

            router.refresh();
        } catch (error) {
            setSaveError(
                error instanceof Error
                    ? error.message
                    : "Unable to delete product."
            );

            setDeleting(false);
        }
    }

    async function saveProduct() {
        if (!product || saving) return;

        const confirmed = window.confirm(
            `Save changes to ${
                product.title ||
                product.handle
            }?`
        );

        if (!confirmed) return;

        setSaving(true);
        setSaveMessage("");
        setSaveError("");

        try {
            const response = await fetch(
                `/api/admin/products/${encodeURIComponent(
                    product.handle
                )}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify(
                        product
                    ),
                }
            );

            const responseText =
                await response.text();

            let data: any = {};

            try {
                data = responseText
                    ? JSON.parse(
                          responseText
                      )
                    : {};
            } catch {
                throw new Error(
                    response.ok
                        ? "The server returned an invalid response."
                        : `Save failed with HTTP ${response.status}.`
                );
            }

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.error ||
                        "Unable to save product."
                );
            }

            if (data.product) {
                setProduct(
                    data.product
                );
            }

            setSaveMessage(
                "Product saved successfully."
            );
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

                    <p>{product.title}</p>
                </div>

                <div className="admin-edit-actions">
                    <a
                        href={`https://sparesco.com/products/${encodeURIComponent(
                            product.handle
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-secondary-button"
                    >
                        View Product ↗
                    </a>

                    <button
                        type="button"
                        className="admin-primary-button"
                        onClick={saveProduct}
                        disabled={saving || !product}
                    >
                        {saving
                            ? "Saving..."
                            : "Save Product"}
                    </button>
                </div>
            </div>

            {saveMessage && (
                <div
                    className="admin-save-banner admin-save-banner-success"
                    role="status"
                >
                    <div>
                        <strong>
                            Product saved successfully
                        </strong>

                        <span>
                            Your changes have been
                            saved to the product.
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            setSaveMessage("")
                        }
                        aria-label="Dismiss notification"
                    >
                        ×
                    </button>
                </div>
            )}

            {saveError && (
                <div
                    className="admin-save-banner admin-save-banner-error"
                    role="alert"
                >
                    <div>
                        <strong>
                            Product could not be saved
                        </strong>

                        <span>{saveError}</span>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            setSaveError("")
                        }
                        aria-label="Dismiss notification"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* PRODUCT DETAILS */}

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
                        <label>Handle</label>

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
                            value={
                                product.collection
                            }
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
                            value={
                                product.category
                            }
                            onChange={(e) =>
                                updateProduct(
                                    "category",
                                    e.target.value
                                )
                            }
                        />
                    </div>

                    <div className="admin-field admin-field-full">
                        <label>Tags</label>

                        <input
                            value={product.tags.join(
                                ", "
                            )}
                            onChange={(e) =>
                                updateProduct(
                                    "tags",
                                    e.target.value
                                        .split(",")
                                        .map((tag) =>
                                            tag.trim()
                                        )
                                        .filter(
                                            Boolean
                                        )
                                )
                            }
                            placeholder="tag-one, tag-two"
                        />
                    </div>
                </div>
            </section>

            {/* IMAGES */}

            <section className="admin-edit-card">
                <div className="admin-image-section-heading">
                    <div>
                        <h2>
                            Images (
                            {product.images.length})
                        </h2>

                        <p className="admin-section-note">
                            Add product images,
                            remove images or assign
                            an image to all variants.
                        </p>
                    </div>

                    <div>
                        <input
                            ref={
                                productImageInputRef
                            }
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                            multiple
                            hidden
                            onChange={
                                uploadImages
                            }
                        />

                        <button
                            type="button"
                            className="admin-secondary-button"
                            disabled={
                                uploadingImages
                            }
                            onClick={() =>
                                productImageInputRef.current?.click()
                            }
                        >
                            {uploadingImages
                                ? "Uploading..."
                                : "+ Add Images"}
                        </button>
                    </div>
                </div>

                {imageError && (
                    <div className="admin-form-error">
                        {imageError}
                    </div>
                )}

                {product.images.length ===
                0 ? (
                    <div className="admin-product-empty">
                        No product images.
                    </div>
                ) : (
                    <div className="admin-edit-images">
                        {product.images.map(
                            (
                                image,
                                index
                            ) => (
                                <div
                                    key={`${image}-${index}`}
                                    className="admin-edit-image-card admin-manage-image-card"
                                >
                                    <div className="admin-manage-image-preview">
                                        <img
                                            src={getCatalogThumbnailUrl(
                                                {
                                                    image,
                                                    imageFolder:
                                                        product.imageFolder,
                                                    collection:
                                                        product.collection,
                                                }
                                            )}
                                            alt={
                                                product.title
                                            }
                                            onError={(
                                                event
                                            ) => {
                                                const original =
                                                    getOriginalImageUrl(
                                                        {
                                                            image,
                                                            imageFolder:
                                                                product.imageFolder,
                                                            collection:
                                                                product.collection,
                                                        }
                                                    );

                                                if (
                                                    event
                                                        .currentTarget
                                                        .src !==
                                                    original
                                                ) {
                                                    event.currentTarget.src =
                                                        original;
                                                }
                                            }}
                                        />
                                    </div>

                                    <span
                                        className="admin-image-filename"
                                        title={image}
                                    >
                                        {image}
                                    </span>

                                    <div className="admin-image-actions">
                                        <button
                                            type="button"
                                            className="admin-image-assign-button"
                                            onClick={() =>
                                                assignImageToAllVariants(
                                                    image
                                                )
                                            }
                                        >
                                            Assign to all
                                        </button>

                                        <button
                                            type="button"
                                            className="admin-image-remove-button"
                                            onClick={() =>
                                                removeProductImage(
                                                    image
                                                )
                                            }
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}
            </section>

            {/* VARIANTS */}

            <section className="admin-edit-card">
                <h2>
                    Variants (
                    {product.variants.length})
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
                                    key={
                                        variant.id ||
                                        `${variant.partNumber || "variant"}-${index}`
                                    }
                                >
                                    <button
                                        type="button"
                                        className="admin-variant-header"
                                        onClick={() =>
                                            toggleVariant(
                                                index
                                            )
                                        }
                                    >
                                        <div>
                                            <strong>
                                                {variant.title ||
                                                    `Variant ${
                                                        index +
                                                        1
                                                    }`}
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
                                            <div className="admin-variant-image-manager">
                                                <label>
                                                    Variant
                                                    Image
                                                </label>

                                                {variant.image ? (
                                                    <div className="admin-current-variant-image">
                                                        <img
                                                            src={getCatalogThumbnailUrl(
                                                                {
                                                                    image:
                                                                        variant.image,
                                                                    imageFolder:
                                                                        product.imageFolder,
                                                                    collection:
                                                                        product.collection,
                                                                }
                                                            )}
                                                            alt={
                                                                variant.title ||
                                                                product.title
                                                            }
                                                            onError={(
                                                                event
                                                            ) => {
                                                                const original =
                                                                    getOriginalImageUrl(
                                                                        {
                                                                            image:
                                                                                variant.image,
                                                                            imageFolder:
                                                                                product.imageFolder,
                                                                            collection:
                                                                                product.collection,
                                                                        }
                                                                    );

                                                                if (
                                                                    event
                                                                        .currentTarget
                                                                        .src !==
                                                                    original
                                                                ) {
                                                                    event.currentTarget.src =
                                                                        original;
                                                                }
                                                            }}
                                                        />

                                                        <div>
                                                            <span>
                                                                {
                                                                    variant.image
                                                                }
                                                            </span>

                                                            <button
                                                                type="button"
                                                                className="admin-image-remove-button"
                                                                onClick={() =>
                                                                    removeVariantImage(
                                                                        index
                                                                    )
                                                                }
                                                            >
                                                                Remove
                                                                from
                                                                variant
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="admin-variant-no-image">
                                                        No
                                                        image
                                                        assigned
                                                        to this
                                                        variant.
                                                    </div>
                                                )}

                                                {product
                                                    .images
                                                    .length >
                                                    0 && (
                                                    <>
                                                        <div className="admin-variant-image-label">
                                                            Select
                                                            product
                                                            image
                                                        </div>

                                                        <div className="admin-variant-image-picker">
                                                            {product.images.map(
                                                                (
                                                                    image
                                                                ) => (
                                                                    <button
                                                                        key={
                                                                            image
                                                                        }
                                                                        type="button"
                                                                        className={
                                                                            variant.image ===
                                                                            image
                                                                                ? "admin-variant-image-option admin-variant-image-option-selected"
                                                                                : "admin-variant-image-option"
                                                                        }
                                                                        onClick={() =>
                                                                            assignImageToVariant(
                                                                                index,
                                                                                image
                                                                            )
                                                                        }
                                                                        title="Assign this image to this variant"
                                                                    >
                                                                        <img
                                                                            src={getCatalogThumbnailUrl(
                                                                                {
                                                                                    image,
                                                                                    imageFolder:
                                                                                        product.imageFolder,
                                                                                    collection:
                                                                                        product.collection,
                                                                                }
                                                                            )}
                                                                            alt=""
                                                                            onError={(
                                                                                event
                                                                            ) => {
                                                                                const original =
                                                                                    getOriginalImageUrl(
                                                                                        {
                                                                                            image,
                                                                                            imageFolder:
                                                                                                product.imageFolder,
                                                                                            collection:
                                                                                                product.collection,
                                                                                        }
                                                                                    );

                                                                                if (
                                                                                    event
                                                                                        .currentTarget
                                                                                        .src !==
                                                                                    original
                                                                                ) {
                                                                                    event.currentTarget.src =
                                                                                        original;
                                                                                }
                                                                            }}
                                                                        />
                                                                    </button>
                                                                )
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            <div className="admin-form-grid">
                                                <div className="admin-field admin-field-full">
                                                    <label>
                                                        Variant
                                                        Title
                                                    </label>

                                                    <input
                                                        value={
                                                            variant.title ||
                                                            ""
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            updateVariant(
                                                                index,
                                                                "title",
                                                                e
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="admin-field">
                                                    <label>
                                                        Option
                                                        1 Name
                                                    </label>

                                                    <input
                                                        value={
                                                            variant.option1Name ||
                                                            ""
                                                        }
                                                        placeholder="e.g. Model"
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            updateVariant(
                                                                index,
                                                                "option1Name",
                                                                e
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="admin-field">
                                                    <label>
                                                        Option
                                                        1 Value
                                                    </label>

                                                    <input
                                                        value={
                                                            variant.option1Value ||
                                                            ""
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            updateVariant(
                                                                index,
                                                                "option1Value",
                                                                e
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="admin-field">
                                                    <label>
                                                        Option
                                                        2 Name
                                                    </label>

                                                    <input
                                                        value={
                                                            variant.option2Name ||
                                                            ""
                                                        }
                                                        placeholder="e.g. Size"
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            updateVariant(
                                                                index,
                                                                "option2Name",
                                                                e
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="admin-field">
                                                    <label>
                                                        Option
                                                        2 Value
                                                    </label>

                                                    <input
                                                        value={
                                                            variant.option2Value ||
                                                            ""
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            updateVariant(
                                                                index,
                                                                "option2Value",
                                                                e
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="admin-field">
                                                    <label>
                                                        Option
                                                        3 Name
                                                    </label>

                                                    <input
                                                        value={
                                                            variant.option3Name ||
                                                            ""
                                                        }
                                                        placeholder="e.g. Material"
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            updateVariant(
                                                                index,
                                                                "option3Name",
                                                                e
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="admin-field">
                                                    <label>
                                                        Option
                                                        3 Value
                                                    </label>

                                                    <input
                                                        value={
                                                            variant.option3Value ||
                                                            ""
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            updateVariant(
                                                                index,
                                                                "option3Value",
                                                                e
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="admin-field">
                                                    <label>
                                                        Part
                                                        Number
                                                    </label>

                                                    <input
                                                        value={
                                                            variant.partNumber ||
                                                            ""
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            updateVariant(
                                                                index,
                                                                "partNumber",
                                                                e
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="admin-field">
                                                    <label>
                                                        SKU
                                                    </label>

                                                    <input
                                                        value={
                                                            variant.sku ||
                                                            ""
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            updateVariant(
                                                                index,
                                                                "sku",
                                                                e
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="admin-field">
                                                    <label>
                                                        Barcode
                                                    </label>

                                                    <input
                                                        value={
                                                            variant.barcode ||
                                                            ""
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            updateVariant(
                                                                index,
                                                                "barcode",
                                                                e
                                                                    .target
                                                                    .value
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
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            updateVariant(
                                                                index,
                                                                "vendor",
                                                                e
                                                                    .target
                                                                    .value
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
                                                        step="any"
                                                        value={
                                                            variant.price ??
                                                            ""
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            updateVariant(
                                                                index,
                                                                "price",
                                                                e
                                                                    .target
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
                                                        Compare
                                                        At Price
                                                    </label>

                                                    <input
                                                        type="number"
                                                        step="any"
                                                        value={
                                                            variant.compareAtPrice ??
                                                            ""
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            updateVariant(
                                                                index,
                                                                "compareAtPrice",
                                                                e
                                                                    .target
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
                                                        Cost
                                                    </label>

                                                    <input
                                                        type="number"
                                                        step="any"
                                                        value={
                                                            variant.cost ??
                                                            ""
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            updateVariant(
                                                                index,
                                                                "cost",
                                                                e
                                                                    .target
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
                                                        Inventory
                                                        Quantity
                                                    </label>

                                                    <input
                                                        type="number"
                                                        value={
                                                            variant.inventoryQty ??
                                                            ""
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            updateVariant(
                                                                index,
                                                                "inventoryQty",
                                                                e
                                                                    .target
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
                                                        Inventory
                                                        Tracker
                                                    </label>

                                                    <input
                                                        value={
                                                            variant.inventoryTracker ||
                                                            ""
                                                        }
                                                        placeholder="shopify"
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            updateVariant(
                                                                index,
                                                                "inventoryTracker",
                                                                e
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="admin-field">
                                                    <label>
                                                        Inventory
                                                        Policy
                                                    </label>

                                                    <select
                                                        value={
                                                            variant.inventoryPolicy ||
                                                            ""
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            updateVariant(
                                                                index,
                                                                "inventoryPolicy",
                                                                e
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    >
                                                        <option value="">
                                                            Not set
                                                        </option>

                                                        <option value="deny">
                                                            Deny
                                                        </option>

                                                        <option value="continue">
                                                            Continue
                                                        </option>
                                                    </select>
                                                </div>

                                                <div className="admin-field">
                                                    <label>
                                                        Country
                                                        of Origin
                                                    </label>

                                                    <input
                                                        value={
                                                            variant.countryOfOrigin ||
                                                            ""
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            updateVariant(
                                                                index,
                                                                "countryOfOrigin",
                                                                e
                                                                    .target
                                                                    .value
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
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            updateVariant(
                                                                index,
                                                                "hsCode",
                                                                e
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="admin-field">
                                                    <label>
                                                        Weight
                                                    </label>

                                                    <input
                                                        type="number"
                                                        step="any"
                                                        value={
                                                            variant.weight ??
                                                            ""
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            updateVariant(
                                                                index,
                                                                "weight",
                                                                e
                                                                    .target
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
                                                        Weight
                                                        Unit
                                                    </label>

                                                    <select
                                                        value={
                                                            variant.weightUnit ||
                                                            ""
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            updateVariant(
                                                                index,
                                                                "weightUnit",
                                                                e
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    >
                                                        <option value="">
                                                            Not set
                                                        </option>

                                                        <option value="kg">
                                                            kg
                                                        </option>

                                                        <option value="g">
                                                            g
                                                        </option>

                                                        <option value="lb">
                                                            lb
                                                        </option>

                                                        <option value="oz">
                                                            oz
                                                        </option>
                                                    </select>
                                                </div>

                                                <div className="admin-field">
                                                    <label>
                                                        Unit
                                                        Weight
                                                    </label>

                                                    <input
                                                        value={
                                                            variant.unitWeight ||
                                                            ""
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            updateVariant(
                                                                index,
                                                                "unitWeight",
                                                                e
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="admin-field">
                                                    <label>
                                                        Shipping
                                                        Volume
                                                    </label>

                                                    <input
                                                        value={
                                                            variant.shippingVolume ||
                                                            ""
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            updateVariant(
                                                                index,
                                                                "shippingVolume",
                                                                e
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="admin-field">
                                                    <label>
                                                        Shipping
                                                        Profile
                                                    </label>

                                                    <input
                                                        value={
                                                            variant.shippingProfile ||
                                                            ""
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            updateVariant(
                                                                index,
                                                                "shippingProfile",
                                                                e
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="admin-field">
                                                    <label>
                                                        Tax Code
                                                    </label>

                                                    <input
                                                        value={
                                                            variant.taxCode ||
                                                            ""
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            updateVariant(
                                                                index,
                                                                "taxCode",
                                                                e
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="admin-field">
                                                    <label>
                                                        Taxable
                                                    </label>

                                                    <select
                                                        value={
                                                            variant.taxable ===
                                                            false
                                                                ? "false"
                                                                : "true"
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            updateVariant(
                                                                index,
                                                                "taxable",
                                                                e
                                                                    .target
                                                                    .value ===
                                                                    "true"
                                                            )
                                                        }
                                                    >
                                                        <option value="true">
                                                            Yes
                                                        </option>

                                                        <option value="false">
                                                            No
                                                        </option>
                                                    </select>
                                                </div>

                                                <div className="admin-field">
                                                    <label>
                                                        Requires
                                                        Shipping
                                                    </label>

                                                    <select
                                                        value={
                                                            variant.requiresShipping ===
                                                            false
                                                                ? "false"
                                                                : "true"
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            updateVariant(
                                                                index,
                                                                "requiresShipping",
                                                                e
                                                                    .target
                                                                    .value ===
                                                                    "true"
                                                            )
                                                        }
                                                    >
                                                        <option value="true">
                                                            Yes
                                                        </option>

                                                        <option value="false">
                                                            No
                                                        </option>
                                                    </select>
                                                </div>

                                                <div className="admin-field admin-field-full">
                                                    <label>
                                                        Description
                                                    </label>

                                                    <textarea
                                                        rows={5}
                                                        value={
                                                            variant.description ||
                                                            ""
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            updateVariant(
                                                                index,
                                                                "description",
                                                                e
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="admin-field admin-field-full">
                                                    <label>
                                                        Specifications
                                                    </label>

                                                    <textarea
                                                        rows={6}
                                                        value={(
                                                            variant.specifications ||
                                                            []
                                                        ).join(
                                                            "\n"
                                                        )}
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            updateVariant(
                                                                index,
                                                                "specifications",
                                                                e
                                                                    .target
                                                                    .value
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
                                                        placeholder={
                                                            "One specification per line"
                                                        }
                                                    />
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

            {/* SOURCE INFORMATION */}

            {product.sources &&
                product.sources.length > 0 && (
                    <section className="admin-edit-card">
                        <h2>
                            Source Information
                        </h2>

                        <div className="admin-source-list">
                            {product.sources.map(
                                (
                                    source,
                                    index
                                ) => (
                                    <div
                                        className="admin-source-card"
                                        key={
                                            index
                                        }
                                    >
                                        <div>
                                            <strong>
                                                Collection
                                            </strong>

                                            <span>
                                                {source.collectionName ||
                                                    source.collectionHandle ||
                                                    "—"}
                                            </span>
                                        </div>

                                        <div>
                                            <strong>
                                                Excel
                                                File
                                            </strong>

                                            <span>
                                                {source.excelFile ||
                                                    "—"}
                                            </span>
                                        </div>

                                        <div>
                                            <strong>
                                                Source
                                                Row
                                            </strong>

                                            <span>
                                                {source.sourceRow ??
                                                    "—"}
                                            </span>
                                        </div>

                                        <div>
                                            <strong>
                                                Raw Part
                                                Number
                                            </strong>

                                            <span>
                                                {source.rawPartNumber ||
                                                    "—"}
                                            </span>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </section>
                )}

            {/* DELETE PRODUCT */}

            <section className="admin-edit-card admin-danger-card">
                <div className="admin-danger-card-content">
                    <div>
                        <h2>
                            Delete Product
                        </h2>

                        <p>
                            Permanently remove this
                            product from the
                            catalogue, collections
                            and search.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="admin-danger-button"
                        onClick={
                            deleteCurrentProduct
                        }
                        disabled={
                            deleting || saving
                        }
                    >
                        {deleting
                            ? "Deleting..."
                            : "Delete Product"}
                    </button>
                </div>
            </section>
        </main>
    );
}