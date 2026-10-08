"use client";

export const runtime = "edge";

import Link from "next/link";
import { getCatalogThumbnailUrl } from "@/lib/catalog/thumbnail";

import {
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    useParams,
} from "next/navigation";

type Collection = {
    title: string;
    handle: string;
    count: number;
    description?: string;
    seoTitle?: string;
    seoDescription?: string;
};

type Product = {
    handle?: string;
    h?: string;

    title?: string;
    t?: string;

    partNumber?: string;
    p?: string;

    vendor?: string;
    v?: string;

    image?: string;
    i?: string;
};

function value(
    primary: unknown,
    fallback: unknown
) {
    return String(
        primary ??
        fallback ??
        ""
    ).trim();
}

export default function AdminCollectionPage() {
    const params =
        useParams<{
            handle: string;
        }>();

    const routeHandle =
        decodeURIComponent(
            String(
                params?.handle || ""
            )
        );

    const [
        collection,
        setCollection,
    ] =
        useState<Collection | null>(
            null
        );

    const [
        products,
        setProducts,
    ] =
        useState<Product[]>([]);

    const [
        title,
        setTitle,
    ] = useState("");

    const [
        description,
        setDescription,
    ] = useState("");

    const [
        handle,
        setHandle,
    ] = useState("");

    const [
        seoTitle,
        setSeoTitle,
    ] = useState("");

    const [
        seoDescription,
        setSeoDescription,
    ] = useState("");

    const [
        productSearch,
        setProductSearch,
    ] = useState("");

    const [
        productPage,
        setProductPage,
    ] = useState(1);

    const PRODUCTS_PER_PAGE = 24;

    const [
        productsComplete,
        setProductsComplete,
    ] = useState(false);

    const [
        browseOpen,
        setBrowseOpen,
    ] = useState(false);

    const [
        browseQuery,
        setBrowseQuery,
    ] = useState("");

    const [
        browseResults,
        setBrowseResults,
    ] = useState<Product[]>([]);

    const [
        browseLoading,
        setBrowseLoading,
    ] = useState(false);

    const [
        membershipLoading,
        setMembershipLoading,
    ] = useState("");

    const [
        membershipError,
        setMembershipError,
    ] = useState("");

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState("");

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        saveError,
        setSaveError,
    ] = useState("");

    const [
        saveProgress,
        setSaveProgress,
    ] = useState("");

    const [
        deleting,
        setDeleting,
    ] = useState(false);

    const [
        deleteError,
        setDeleteError,
    ] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setLoading(true);
                setError("");

                const response =
                    await fetch(
                        `/api/admin/collections/${encodeURIComponent(
                            routeHandle
                        )}?page=1`,
                        {
                            cache: "no-store",
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data?.message ||
                        data?.error ||
                        "Unable to load collection."
                    );
                }

                if (cancelled) {
                    return;
                }

                const nextCollection =
                    data.collection as Collection;

                setCollection(
                    nextCollection
                );

                setProducts(
                    Array.isArray(
                        data.products
                    )
                        ? data.products
                        : []
                );
                setProductsComplete(false);
                setTitle(
                    nextCollection.title ||
                    ""
                );

                setDescription(
                    nextCollection.description ||
                    ""
                );

                setHandle(
                    nextCollection.handle ||
                    routeHandle
                );

                setSeoTitle(
                    nextCollection.seoTitle ||
                    ""
                );

                setSeoDescription(
                    nextCollection.seoDescription ||
                    ""
                );
            } catch (error) {
                if (!cancelled) {
                    setError(
                        error instanceof Error
                            ? error.message
                            : "Unable to load collection."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        if (routeHandle) {
            load();
        }

        return () => {
            cancelled = true;
        };
    }, [routeHandle]);

    useEffect(() => {
        if (
            !routeHandle ||
            !collection ||
            productsComplete ||
            (
                productPage === 1 &&
                !productSearch.trim() &&
                !browseOpen
            )
        ) {
            return;
        }

        let cancelled = false;

        async function loadAllProducts() {
            try {
                const response = await fetch(
                    `/api/admin/collections/${encodeURIComponent(
                        routeHandle
                    )}`,
                    {
                        cache: "no-store",
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data?.error ||
                        "Unable to load collection products."
                    );
                }

                if (cancelled) {
                    return;
                }

                setProducts(
                    Array.isArray(data.products)
                        ? data.products
                        : []
                );

                setProductsComplete(true);
            } catch (error) {
                if (!cancelled) {
                    setError(
                        error instanceof Error
                            ? error.message
                            : "Unable to load collection products."
                    );
                }
            }
        }

        loadAllProducts();

        return () => {
            cancelled = true;
        };
    }, [
        routeHandle,
        collection,
        productsComplete,
        productPage,
        productSearch,
        browseOpen,
    ]);

    const filteredProducts =
        useMemo(() => {
            const query =
                productSearch
                    .trim()
                    .toLowerCase();

            if (!query) {
                return products;
            }

            return products.filter(
                (product) => {
                    const searchable = [
                        value(
                            product.title,
                            product.t
                        ),

                        value(
                            product.partNumber,
                            product.p
                        ),

                        value(
                            product.vendor,
                            product.v
                        ),

                        value(
                            product.handle,
                            product.h
                        ),
                    ]
                        .join(" ")
                        .toLowerCase();

                    return searchable.includes(
                        query
                    );
                }
            );
        }, [
            productSearch,
            products,
        ]);

    const totalProductPages =
        Math.max(
            1,
            Math.ceil(
                (
                    productsComplete
                        ? filteredProducts.length
                        : (
                            productSearch.trim()
                                ? filteredProducts.length
                                : collection?.count || 0
                        )
                ) / PRODUCTS_PER_PAGE
            )
        );

    const safeProductPage =
        Math.min(
            productPage,
            totalProductPages
        );

    const paginatedProducts =
        useMemo(() => {
            const start =
                (safeProductPage - 1) *
                PRODUCTS_PER_PAGE;

            return filteredProducts.slice(
                start,
                start + PRODUCTS_PER_PAGE
            );
        }, [
            filteredProducts,
            safeProductPage,
        ]);

    async function searchBrowseProducts() {
        const query =
            browseQuery.trim();

        if (query.length < 2) {
            setMembershipError(
                "Enter at least 2 characters."
            );
            return;
        }

        try {
            setBrowseLoading(true);
            setMembershipError("");

            const response =
                await fetch(
                    `/api/search?q=${encodeURIComponent(
                        query
                    )}`
                );

            if (!response.ok) {
                throw new Error(
                    "Unable to search products."
                );
            }

            const data =
                (await response.json()) as Product[];

            let membershipProducts = products;

            if (!productsComplete) {
                const membershipResponse = await fetch(
                    `/api/admin/collections/${encodeURIComponent(
                        routeHandle
                    )}`,
                    {
                        cache: "no-store",
                    }
                );

                const membershipData =
                    await membershipResponse.json();

                if (!membershipResponse.ok) {
                    throw new Error(
                        membershipData?.error ||
                        "Unable to check collection products."
                    );
                }

                membershipProducts = Array.isArray(
                    membershipData.products
                )
                    ? membershipData.products
                    : [];

                setProducts(membershipProducts);
                setProductsComplete(true);
            }

            const currentHandles =
                new Set(
                    membershipProducts
                        .map((product) =>
                            value(
                                product.handle,
                                product.h
                            )
                        )
                        .filter(Boolean)
                );

            setBrowseResults(
                data.filter(
                    (product) => {
                        const productHandle =
                            value(
                                product.handle,
                                product.h
                            );

                        return (
                            productHandle &&
                            !currentHandles.has(
                                productHandle
                            )
                        );
                    }
                )
            );
        } catch (error) {
            setBrowseResults([]);

            setMembershipError(
                error instanceof Error
                    ? error.message
                    : "Unable to search products."
            );
        } finally {
            setBrowseLoading(false);
        }
    }

    async function changeMembership(
        action: "add" | "remove",
        productHandle: string
    ) {
        try {
            setMembershipLoading(
                `${action}:${productHandle}`
            );

            setMembershipError("");

            const response =
                await fetch(
                    `/api/admin/collections/${encodeURIComponent(
                        collection!.handle
                    )}`,
                    {
                        method: "POST",

                        headers: {
                            "content-type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                action,
                                productHandle,
                            }),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.error ||
                    data?.message ||
                    "Unable to update collection."
                );
            }

            /*
             * Reload from the collection
             * indexes after synchronization.
             * This means the UI reflects what
             * was actually written to R2.
             */
            const refreshed =
                await fetch(
                    `/api/admin/collections/${encodeURIComponent(
                        collection!.handle
                    )}`,
                    {
                        cache: "no-store",
                    }
                );

            const refreshedData =
                await refreshed.json();

            if (!refreshed.ok) {
                throw new Error(
                    refreshedData?.error ||
                    "Unable to reload collection."
                );
            }

            setCollection(
                refreshedData.collection
            );

            setProducts(
                Array.isArray(
                    refreshedData.products
                )
                    ? refreshedData.products
                    : []
            );

            setProductsComplete(true);

            if (action === "add") {
                setBrowseResults(
                    (current) =>
                        current.filter(
                            (product) =>
                                value(
                                    product.handle,
                                    product.h
                                ) !==
                                productHandle
                        )
                );
            }
        } catch (error) {
            setMembershipError(
                error instanceof Error
                    ? error.message
                    : "Unable to update collection."
            );
        } finally {
            setMembershipLoading("");
        }
    }

    async function deleteCurrentCollection() {
        if (!collection || deleting) {
            return;
        }

        const confirmed =
            window.confirm(
                `Delete "${collection.title}"?\n\nProducts will NOT be deleted.\n\nProducts that belong only to this collection will be moved to Uncategorized.`
            );

        if (!confirmed) {
            return;
        }

        try {
            setDeleting(true);
            setDeleteError("");

            const response =
                await fetch(
                    `/api/admin/collections/${encodeURIComponent(
                        collection.handle
                    )}`,
                    {
                        method: "DELETE",
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.error ||
                    data?.message ||
                    "Unable to delete collection."
                );
            }

            window.location.href =
                "/admin/collections";
        } catch (error) {
            setDeleteError(
                error instanceof Error
                    ? error.message
                    : "Unable to delete collection."
            );
        } finally {
            setDeleting(false);
        }
    }

    async function saveCollection() {
        if (!collection || saving) {
            return;
        }

        const nextTitle =
            title.trim();

        const nextHandle =
            handle
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");

        if (!nextTitle) {
            setSaveError(
                "Collection title is required."
            );
            return;
        }

        if (!nextHandle) {
            setSaveError(
                "Collection handle is required."
            );
            return;
        }

        try {
            setSaving(true);
            setSaveError("");
            setSaveProgress("");

            const oldHandle =
                collection.handle;

            /*
             * NORMAL SAVE
             *
             * No URL change:
             * update title, description
             * and SEO metadata only.
             */
            if (
                nextHandle ===
                oldHandle
            ) {
                const response =
                    await fetch(
                        `/api/admin/collections/${encodeURIComponent(
                            oldHandle
                        )}`,
                        {
                            method: "PUT",

                            headers: {
                                "content-type":
                                    "application/json",
                            },

                            body:
                                JSON.stringify({
                                    title:
                                        nextTitle,

                                    handle:
                                        oldHandle,

                                    description:
                                        description.trim(),

                                    seoTitle:
                                        seoTitle.trim(),

                                    seoDescription:
                                        seoDescription.trim(),
                                }),
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data?.error ||
                        data?.message ||
                        "Unable to save collection."
                    );
                }

                setCollection(
                    data.collection
                );

                setTitle(
                    data.collection.title ||
                    nextTitle
                );

                setDescription(
                    data.collection.description ||
                    ""
                );

                setHandle(
                    data.collection.handle ||
                    oldHandle
                );

                setSeoTitle(
                    data.collection.seoTitle ||
                    ""
                );

                setSeoDescription(
                    data.collection.seoDescription ||
                    ""
                );

                setSaveProgress(
                    "Saved."
                );

                return;
            }

            /*
             * HANDLE CHANGE
             *
             * 1. Create destination
             * 2. Move each product
             * 3. Finalize old collection
             * 4. Save edited metadata
             */
            setSaveProgress(
                "Preparing collection migration..."
            );

            const prepareResponse =
                await fetch(
                    `/api/admin/collections/${encodeURIComponent(
                        oldHandle
                    )}`,
                    {
                        method: "POST",

                        headers: {
                            "content-type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                action:
                                    "prepare-handle-migration",

                                newHandle:
                                    nextHandle,
                            }),
                    }
                );

            const prepareData =
                await prepareResponse.json();

            if (!prepareResponse.ok) {
                throw new Error(
                    prepareData?.error ||
                    prepareData?.message ||
                    "Unable to prepare collection migration."
                );
            }

            const productHandles =
                Array.isArray(
                    prepareData.productHandles
                )
                    ? prepareData.productHandles
                    : [];

            for (
                let index = 0;
                index <
                productHandles.length;
                index += 1
            ) {
                const productHandle =
                    String(
                        productHandles[index] ||
                        ""
                    ).trim();

                if (!productHandle) {
                    continue;
                }

                setSaveProgress(
                    `Moving product ${index + 1
                    } of ${productHandles.length
                    }...`
                );

                const migrateResponse =
                    await fetch(
                        `/api/admin/collections/${encodeURIComponent(
                            oldHandle
                        )}`,
                        {
                            method: "POST",

                            headers: {
                                "content-type":
                                    "application/json",
                            },

                            body:
                                JSON.stringify({
                                    action:
                                        "migrate-handle-product",

                                    newHandle:
                                        nextHandle,

                                    productHandle,
                                }),
                        }
                    );

                const migrateData =
                    await migrateResponse.json();

                if (!migrateResponse.ok) {
                    throw new Error(
                        migrateData?.error ||
                        migrateData?.message ||
                        `Unable to migrate product "${productHandle}".`
                    );
                }
            }

            setSaveProgress(
                "Finalizing collection migration..."
            );

            const finalizeResponse =
                await fetch(
                    `/api/admin/collections/${encodeURIComponent(
                        oldHandle
                    )}`,
                    {
                        method: "POST",

                        headers: {
                            "content-type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                action:
                                    "finalize-handle-migration",

                                newHandle:
                                    nextHandle,
                            }),
                    }
                );

            const finalizeData =
                await finalizeResponse.json();

            if (!finalizeResponse.ok) {
                throw new Error(
                    finalizeData?.error ||
                    finalizeData?.message ||
                    "Unable to finalize collection migration."
                );
            }

            /*
             * The destination was initially
             * created using the old metadata.
             * Apply the values currently
             * entered in the editor.
             */
            setSaveProgress(
                "Saving collection details..."
            );

            const detailsResponse =
                await fetch(
                    `/api/admin/collections/${encodeURIComponent(
                        nextHandle
                    )}`,
                    {
                        method: "PUT",

                        headers: {
                            "content-type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                title:
                                    nextTitle,

                                handle:
                                    nextHandle,

                                description:
                                    description.trim(),

                                seoTitle:
                                    seoTitle.trim(),

                                seoDescription:
                                    seoDescription.trim(),
                            }),
                    }
                );

            const detailsData =
                await detailsResponse.json();

            if (!detailsResponse.ok) {
                throw new Error(
                    detailsData?.error ||
                    detailsData?.message ||
                    "Collection migrated, but its details could not be saved."
                );
            }

            /*
             * Use a hard navigation because
             * the admin route itself changed.
             */
            window.location.href =
                `/admin/collections/${encodeURIComponent(
                    nextHandle
                )}`;
        } catch (error) {
            setSaveError(
                error instanceof Error
                    ? error.message
                    : "Unable to save collection."
            );

            setSaveProgress("");
        } finally {
            setSaving(false);
        }
    }

    const hasChanges =
        collection
            ? title.trim() !==
            collection.title ||
            description.trim() !==
            (
                collection.description ||
                ""
            ) ||
            handle.trim() !==
            collection.handle ||
            seoTitle.trim() !==
            (
                collection.seoTitle ||
                ""
            ) ||
            seoDescription.trim() !==
            (
                collection.seoDescription ||
                ""
            )
            : false;

    if (loading) {
        return (
            <main className="admin-dashboard">
                <div className="admin-collections-state">
                    Loading collection...
                </div>
            </main>
        );
    }

    if (
        error ||
        !collection
    ) {
        return (
            <main className="admin-dashboard">
                <Link
                    href="/admin/collections"
                    className="admin-collection-back"
                >
                    ← Collections
                </Link>

                <div className="admin-collection-error-banner">
                    {error ||
                        "Collection not found."}
                </div>
            </main>
        );
    }

    return (
        <main className="admin-dashboard">
            <div className="admin-collection-editor-top">
                <div>
                    <Link
                        href="/admin/collections"
                        className="admin-collection-back"
                    >
                        ← Collections
                    </Link>

                    <h1>
                        {collection.title}
                    </h1>
                </div>

                <button
                    type="button"
                    className="admin-primary-button"
                    onClick={saveCollection}
                    disabled={
                        saving ||
                        !hasChanges
                    }
                >
                    {saving
                        ? "Saving..."
                        : "Save"}
                </button>
            </div>

            {saveError ? (
                <div className="admin-collection-error-banner">
                    {saveError}
                </div>
            ) : null}

            {saveProgress ? (
                <div className="admin-collection-unsaved-banner">
                    {saveProgress}
                </div>
            ) : hasChanges ? (
                <div className="admin-collection-unsaved-banner">
                    You have unsaved changes.
                </div>
            ) : null}

            <div className="admin-collection-editor-layout">
                <div className="admin-collection-editor-main">
                    <section className="admin-collection-editor-card">
                        <div className="admin-collection-field">
                            <label htmlFor="collection-title">
                                Title
                            </label>

                            <input
                                id="collection-title"
                                type="text"
                                value={title}
                                onChange={(event) =>
                                    setTitle(
                                        event.target.value
                                    )
                                }
                            />
                        </div>

                        <div className="admin-collection-field">
                            <label htmlFor="collection-description">
                                Description
                            </label>

                            <textarea
                                id="collection-description"
                                value={description}
                                onChange={(event) =>
                                    setDescription(
                                        event.target.value
                                    )
                                }
                                rows={6}
                                placeholder="Describe this collection"
                            />
                        </div>
                    </section>

                    <section className="admin-collection-editor-card">
                        <div className="admin-collection-card-heading">
                            <div>
                                <h2>
                                    Products
                                </h2>

                                <p>
                                    {products.length.toLocaleString()}{" "}
                                    products in this
                                    collection
                                </p>
                            </div>

                            <button
                                type="button"
                                className="admin-secondary-button"
                                onClick={() => {
                                    setBrowseOpen(
                                        (current) => !current
                                    );

                                    setMembershipError("");
                                }}
                            >
                                {browseOpen
                                    ? "Close"
                                    : "Browse"}
                            </button>
                        </div>

                        {browseOpen ? (
                            <div className="admin-collection-browser">
                                <div className="admin-collection-browser-search">
                                    <input
                                        type="search"
                                        value={browseQuery}
                                        onChange={(event) =>
                                            setBrowseQuery(
                                                event.target.value
                                            )
                                        }
                                        onKeyDown={(event) => {
                                            if (
                                                event.key ===
                                                "Enter"
                                            ) {
                                                event.preventDefault();
                                                searchBrowseProducts();
                                            }
                                        }}
                                        placeholder="Search by product name, part number or brand..."
                                    />

                                    <button
                                        type="button"
                                        className="admin-secondary-button"
                                        onClick={
                                            searchBrowseProducts
                                        }
                                        disabled={
                                            browseLoading
                                        }
                                    >
                                        {browseLoading
                                            ? "Searching..."
                                            : "Search"}
                                    </button>
                                </div>

                                {membershipError ? (
                                    <div className="admin-form-error">
                                        {
                                            membershipError
                                        }
                                    </div>
                                ) : null}

                                {browseResults.length >
                                    0 ? (
                                    <div className="admin-collection-browse-results">
                                        {browseResults.map(
                                            (product) => {
                                                const productHandle =
                                                    value(
                                                        product.handle,
                                                        product.h
                                                    );

                                                const productTitle =
                                                    value(
                                                        product.title,
                                                        product.t
                                                    ) ||
                                                    productHandle;

                                                const partNumber =
                                                    value(
                                                        product.partNumber,
                                                        product.p
                                                    );

                                                const vendor =
                                                    value(
                                                        product.vendor,
                                                        product.v
                                                    );

                                                return (
                                                    <div
                                                        className="admin-collection-browse-row"
                                                        key={
                                                            productHandle
                                                        }
                                                    >
                                                        <div className="admin-collection-product-info">
                                                            <strong>
                                                                {
                                                                    productTitle
                                                                }
                                                            </strong>

                                                            <span>
                                                                {[
                                                                    partNumber,
                                                                    vendor,
                                                                ]
                                                                    .filter(
                                                                        Boolean
                                                                    )
                                                                    .join(
                                                                        " · "
                                                                    )}
                                                            </span>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            className="admin-secondary-button"
                                                            disabled={
                                                                membershipLoading ===
                                                                `add:${productHandle}`
                                                            }
                                                            onClick={() =>
                                                                changeMembership(
                                                                    "add",
                                                                    productHandle
                                                                )
                                                            }
                                                        >
                                                            {membershipLoading ===
                                                                `add:${productHandle}`
                                                                ? "Adding..."
                                                                : "Add"}
                                                        </button>
                                                    </div>
                                                );
                                            }
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        ) : null}

                        {products.length >
                            0 ? (
                            <>
                                <div className="admin-collection-product-search">
                                    <input
                                        type="search"
                                        value={
                                            productSearch
                                        }
                                        onChange={(event) => {
                                            setProductSearch(
                                                event.target.value
                                            );

                                            setProductPage(1);
                                        }}
                                        placeholder="Search products in this collection"
                                    />
                                </div>

                                <div className="admin-collection-products">
                                    {filteredProducts.length >
                                        0 ? (
                                        paginatedProducts.map(
                                            (
                                                product,
                                                index
                                            ) => {
                                                const productHandle =
                                                    value(
                                                        product.handle,
                                                        product.h
                                                    );

                                                const productTitle =
                                                    value(
                                                        product.title,
                                                        product.t
                                                    ) ||
                                                    productHandle;

                                                const partNumber =
                                                    value(
                                                        product.partNumber,
                                                        product.p
                                                    );

                                                const vendor =
                                                    value(
                                                        product.vendor,
                                                        product.v
                                                    );

                                                const image =
                                                    value(
                                                        product.image,
                                                        product.i
                                                    );

                                                return (
                                                    <div
                                                        className="admin-collection-product-row"
                                                        key={
                                                            productHandle ||
                                                            `${productTitle}-${index}`
                                                        }
                                                    >
                                                        <div className="admin-collection-product-image">
                                                            {image ? (
                                                                <img
                                                                    src={getCatalogThumbnailUrl({
                                                                        image,
                                                                        collection: collection.handle,
                                                                    })}
                                                                    alt=""
                                                                />
                                                            ) : (
                                                                <span>
                                                                    No image
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="admin-collection-product-info">
                                                            {productHandle ? (
                                                                <Link
                                                                    href={`/admin/products/${encodeURIComponent(
                                                                        productHandle
                                                                    )}`}
                                                                    prefetch={false}
                                                                >
                                                                    {
                                                                        productTitle
                                                                    }
                                                                </Link>
                                                            ) : (
                                                                <strong>
                                                                    {
                                                                        productTitle
                                                                    }
                                                                </strong>
                                                            )}

                                                            <span>
                                                                {[
                                                                    partNumber,
                                                                    vendor,
                                                                ]
                                                                    .filter(
                                                                        Boolean
                                                                    )
                                                                    .join(
                                                                        " · "
                                                                    )}
                                                            </span>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            className="admin-collection-remove-product"
                                                            disabled={
                                                                membershipLoading ===
                                                                `remove:${productHandle}`
                                                            }
                                                            onClick={() =>
                                                                changeMembership(
                                                                    "remove",
                                                                    productHandle
                                                                )
                                                            }
                                                        >
                                                            {membershipLoading ===
                                                                `remove:${productHandle}`
                                                                ? "Removing..."
                                                                : "Remove"}
                                                        </button>
                                                    </div>
                                                );
                                            }
                                        )
                                    ) : (
                                        <div className="admin-collections-state">
                                            No products
                                            match your
                                            search.
                                        </div>
                                    )}
                                </div>
                                {totalProductPages > 1 ? (
                                    <div className="admin-collection-pagination">
                                        <button
                                            type="button"
                                            className="admin-secondary-button"
                                            disabled={
                                                safeProductPage <= 1
                                            }
                                            onClick={() =>
                                                setProductPage(
                                                    Math.max(
                                                        1,
                                                        safeProductPage - 1
                                                    )
                                                )
                                            }
                                        >
                                            Previous
                                        </button>

                                        <span>
                                            Page{" "}
                                            {safeProductPage.toLocaleString()}{" "}
                                            of{" "}
                                            {totalProductPages.toLocaleString()}
                                        </span>

                                        <button
                                            type="button"
                                            className="admin-secondary-button"
                                            disabled={
                                                safeProductPage >=
                                                totalProductPages
                                            }
                                            onClick={() =>
                                                setProductPage(
                                                    Math.min(
                                                        totalProductPages,
                                                        safeProductPage + 1
                                                    )
                                                )
                                            }
                                        >
                                            Next
                                        </button>
                                    </div>
                                ) : null}
                            </>
                        ) : (
                            <div className="admin-collection-empty-products">
                                No products have
                                been added to this
                                collection yet.
                            </div>
                        )}
                    </section>

                    <section className="admin-collection-editor-card">
                        <div className="admin-collection-card-heading">
                            <div>
                                <h2>
                                    Search engine listing
                                </h2>

                                <p>
                                    Edit the collection
                                    search result and URL.
                                </p>
                            </div>
                        </div>

                        <div className="admin-collection-seo-preview">
                            <div className="admin-collection-seo-title">
                                {seoTitle.trim() ||
                                    title.trim() ||
                                    collection.title}
                            </div>

                            <div className="admin-collection-seo-url">
                                https://sparesco.com/collections/
                                {handle.trim()}
                            </div>

                            {(seoDescription.trim() ||
                                description.trim()) ? (
                                <div className="admin-collection-seo-description">
                                    {seoDescription.trim() ||
                                        description.trim()}
                                </div>
                            ) : null}
                        </div>

                        <div className="admin-collection-field">
                            <label htmlFor="collection-seo-title">
                                Page title
                            </label>

                            <input
                                id="collection-seo-title"
                                type="text"
                                value={seoTitle}
                                onChange={(event) =>
                                    setSeoTitle(
                                        event.target.value
                                    )
                                }
                                placeholder={
                                    title ||
                                    collection.title
                                }
                            />

                            <span className="admin-collection-field-help">
                                {seoTitle.length}/70
                            </span>
                        </div>

                        <div className="admin-collection-field">
                            <label htmlFor="collection-seo-description">
                                Meta description
                            </label>

                            <textarea
                                id="collection-seo-description"
                                value={
                                    seoDescription
                                }
                                onChange={(event) =>
                                    setSeoDescription(
                                        event.target.value
                                    )
                                }
                                rows={4}
                                placeholder="Add a description for search engines"
                            />

                            <span className="admin-collection-field-help">
                                {
                                    seoDescription.length
                                }
                                /160
                            </span>
                        </div>

                        <div className="admin-collection-field">
                            <label htmlFor="collection-handle">
                                URL handle
                            </label>

                            <div className="admin-collection-url-field">
                                <span>
                                    /collections/
                                </span>

                                <input
                                    id="collection-handle"
                                    type="text"
                                    value={handle}
                                    onChange={(event) =>
                                        setHandle(
                                            event.target.value
                                        )
                                    }
                                />
                            </div>

                            {handle.trim() !==
                                collection.handle ? (
                                <span className="admin-collection-handle-warning">
                                    Changing this URL
                                    requires migrating
                                    the collection and
                                    creating a permanent
                                    redirect from /
                                    collections/
                                    {
                                        collection.handle
                                    }
                                    .
                                </span>
                            ) : (
                                <span className="admin-collection-field-help">
                                    The collection URL
                                    can be changed. The
                                    old URL will redirect
                                    to the new one.
                                </span>
                            )}
                        </div>
                    </section>

                    <section className="admin-collection-danger-card">
                        <div>
                            <strong>
                                Delete collection
                            </strong>

                            <p>
                                Products will not be
                                deleted.
                            </p>
                        </div>

                        {deleteError ? (
                            <div className="admin-form-error">
                                {deleteError}
                            </div>
                        ) : null}

                        <button
                            type="button"
                            className="admin-danger-button"
                            onClick={
                                deleteCurrentCollection
                            }
                            disabled={
                                deleting ||
                                saving
                            }
                        >
                            {deleting
                                ? "Deleting..."
                                : "Delete collection"}
                        </button>
                    </section>
                </div>
            </div>
        </main>
    );
}