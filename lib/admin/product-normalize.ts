export type ProductMedia = {
    src: string;
    position: number;
    altText: string;
};

export type ProductVariant = {
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

    vendor?: string;
    partNumber?: string;

    hsCode?: string;
    countryOfOrigin?: string;

    description?: string;
    specifications?: string[];

    unitWeight?: string;
    shippingVolume?: string;
};

export type AdminProduct = {
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

    sources?: unknown[];
};

export function clean(
    value: unknown
) {
    return String(
        value ?? ""
    ).trim();
}

export function slugify(
    value: unknown
) {
    return clean(value)
        .toLowerCase()
        .replace(
            /[^a-z0-9]+/g,
            "-"
        )
        .replace(
            /^-+|-+$/g,
            ""
        );
}

export function unique(
    values: string[]
) {
    return Array.from(
        new Set(
            values
                .map(clean)
                .filter(Boolean)
        )
    );
}

function numberValue(
    value: unknown,
    fallback = 0
) {
    if (
        value === "" ||
        value === null ||
        value === undefined
    ) {
        return fallback;
    }

    const parsed =
        Number(value);

    return Number.isFinite(
        parsed
    )
        ? parsed
        : fallback;
}

function integerValue(
    value: unknown,
    fallback = 0
) {
    return Math.trunc(
        numberValue(
            value,
            fallback
        )
    );
}

function booleanValue(
    value: unknown,
    fallback: boolean
) {
    if (
        typeof value ===
        "boolean"
    ) {
        return value;
    }

    if (
        value === 1 ||
        value === "1"
    ) {
        return true;
    }

    if (
        value === 0 ||
        value === "0"
    ) {
        return false;
    }

    const normalized =
        clean(value)
            .toLowerCase();

    if (
        [
            "true",
            "yes",
            "y",
            "active",
            "published",
        ].includes(normalized)
    ) {
        return true;
    }

    if (
        [
            "false",
            "no",
            "n",
            "draft",
            "unpublished",
        ].includes(normalized)
    ) {
        return false;
    }

    return fallback;
}

function normalizeStatus(
    value: unknown
) {
    const status =
        clean(value)
            .toLowerCase();

    if (
        status === "active" ||
        status === "draft" ||
        status === "archived"
    ) {
        return status;
    }

    return status || "active";
}

function normalizeMedia(
    rawMedia: unknown,
    images: string[]
): ProductMedia[] {
    const mediaInput =
        Array.isArray(rawMedia)
            ? rawMedia
            : [];

    const media =
        mediaInput
            .map(
                (
                    item: any,
                    index
                ): ProductMedia | null => {
                    const src =
                        clean(
                            item?.src ||
                            item?.image ||
                            item?.url
                        );

                    if (!src) {
                        return null;
                    }

                    return {
                        src,

                        position:
                            integerValue(
                                item?.position,
                                index + 1
                            ) ||
                            index + 1,

                        altText:
                            clean(
                                item?.altText ||
                                item?.alt ||
                                ""
                            ),
                    };
                }
            )
            .filter(
                (
                    item
                ): item is ProductMedia =>
                    Boolean(item)
            );

    /*
     * Existing catalogue products only
     * have images[].
     *
     * Automatically create media entries
     * so old products remain compatible.
     */
    for (
        let index = 0;
        index < images.length;
        index++
    ) {
        const image =
            images[index];

        if (
            media.some(
                (item) =>
                    item.src === image
            )
        ) {
            continue;
        }

        media.push({
            src: image,
            position:
                index + 1,
            altText: "",
        });
    }

    media.sort(
        (a, b) =>
            a.position -
            b.position
    );

    return media.map(
        (item, index) => ({
            ...item,
            position:
                index + 1,
        })
    );
}

function normalizeVariant(
    raw: any,
    index: number
): ProductVariant {
    const partNumber =
        clean(
            raw?.partNumber
        );

    const option1Value =
        clean(
            raw?.option1Value
        );

    const option2Value =
        clean(
            raw?.option2Value
        );

    const option3Value =
        clean(
            raw?.option3Value
        );

    const generatedTitle =
        [
            option1Value,
            option2Value,
            option3Value,
        ]
            .filter(Boolean)
            .join(" / ");

    return {
        id:
            clean(
                raw?.id
            ),

        title:
            clean(
                raw?.title
            ) ||
            generatedTitle ||
            partNumber,

        option1Name:
            clean(
                raw?.option1Name
            ),

        option1Value,

        option2Name:
            clean(
                raw?.option2Name
            ),

        option2Value,

        option3Name:
            clean(
                raw?.option3Name
            ),

        option3Value,

        position:
            integerValue(
                raw?.position,
                index + 1
            ) ||
            index + 1,

        sku:
            clean(
                raw?.sku
            ),

        barcode:
            clean(
                raw?.barcode
            ),

        image:
            clean(
                raw?.image
            ),

        weight:
            numberValue(
                raw?.weight
            ),

        weightUnit:
            clean(
                raw?.weightUnit
            ),

        price:
            numberValue(
                raw?.price
            ),

        compareAtPrice:
            numberValue(
                raw?.compareAtPrice
            ),

        cost:
            numberValue(
                raw?.cost
            ),

        taxable:
            booleanValue(
                raw?.taxable,
                true
            ),

        taxCode:
            clean(
                raw?.taxCode
            ),

        inventoryTracker:
            clean(
                raw?.inventoryTracker
            ),

        inventoryPolicy:
            clean(
                raw?.inventoryPolicy
            ),

        inventoryQty:
            integerValue(
                raw?.inventoryQty
            ),

        requiresShipping:
            booleanValue(
                raw?.requiresShipping,
                true
            ),

        shippingProfile:
            clean(
                raw?.shippingProfile
            ),

        vendor:
            clean(
                raw?.vendor
            ),

        partNumber,

        hsCode:
            clean(
                raw?.hsCode
            ),

        countryOfOrigin:
            clean(
                raw?.countryOfOrigin
            ),

        description:
            clean(
                raw?.description
            ),

        specifications:
            Array.isArray(
                raw?.specifications
            )
                ? unique(
                    raw.specifications
                        .map(clean)
                        .filter(Boolean)
                )
                : [],

        unitWeight:
            clean(
                raw?.unitWeight
            ),

        shippingVolume:
            clean(
                raw?.shippingVolume
            ),
    };
}

export function normalizeAdminProduct(
    raw: any,
    options?: {
        existing?: any;
        source?: string;
        excelFile?: string;
    }
): AdminProduct {
    const existing =
        options?.existing;

    const handle =
        slugify(
            raw?.handle ||
            existing?.handle
        );

    const incomingTags =
        (
            Array.isArray(
                raw?.tags
            )
                ? raw.tags
                : []
        )
            .map(slugify)
            .filter(Boolean);

    const incomingCollections =
        (
            Array.isArray(
                raw?.customCollections
            )
                ? raw
                    .customCollections
                : []
        )
            .map(slugify)
            .filter(Boolean);

    const requestedCollection =
        slugify(
            raw?.collection
        );

    const requestedCategory =
        slugify(
            raw?.category
        );

    /*
     * Tags remain Sparesco's collection
     * source of truth.
     */
    const tags =
        unique([
            ...incomingTags,
            ...incomingCollections,
            requestedCollection,
            requestedCategory,
        ])
            .map(slugify)
            .filter(Boolean);

    const primaryCollection =
        tags[0] ||
        requestedCollection ||
        requestedCategory ||
        slugify(
            existing?.collection
        );

    const images =
        unique(
            (
                Array.isArray(
                    raw?.images
                )
                    ? raw.images
                    : Array.isArray(
                        existing?.images
                    )
                    ? existing.images
                    : []
            )
                .map(clean)
                .filter(Boolean)
        );

    const media =
        normalizeMedia(
            raw?.media ??
                existing?.media,
            images
        );

    const orderedImages =
        unique([
            ...media.map(
                (item) =>
                    item.src
            ),
            ...images,
        ]);

const rawVariants: any[] =
    Array.isArray(
        raw?.variants
    )
        ? raw.variants
        : [];

    const variants =
        rawVariants.map(
            (
                variant,
                index
            ) =>
                normalizeVariant(
                    variant,
                    index
                )
        );

    const existingSources =
        Array.isArray(
            existing?.sources
        )
            ? existing.sources
            : Array.isArray(
                raw?.sources
            )
            ? raw.sources
            : [];

    return {
        ...(existing &&
        typeof existing ===
            "object"
            ? existing
            : {}),

        handle,

        canonicalKey:
            clean(
                existing
                    ?.canonicalKey ||
                raw
                    ?.canonicalKey
            ) ||
            handle,

        title:
            clean(
                raw?.title
            ),

        bodyHtml:
            clean(
                raw?.bodyHtml
            ),

        vendor:
            clean(
                raw?.vendor
            ),

        type:
            clean(
                raw?.type
            ),

        collection:
            primaryCollection,

        category:
            requestedCategory ||
            primaryCollection,

        categoryId:
            clean(
                raw?.categoryId
            ),

        categoryName:
            clean(
                raw?.categoryName
            ),

        imageFolder:
            clean(
                existing
                    ?.imageFolder
            ) ||
            clean(
                raw?.imageFolder
            ) ||
            primaryCollection,

        tags,

        customCollections:
            unique(
                incomingCollections
            ),

        status:
            normalizeStatus(
                raw?.status
            ),

        published:
            booleanValue(
                raw?.published,
                true
            ),

        publishedAt:
            clean(
                raw?.publishedAt
            ),

        templateSuffix:
            clean(
                raw?.templateSuffix
            ),

        giftCard:
            booleanValue(
                raw?.giftCard,
                false
            ),

        images:
            orderedImages,

        media,

        variants,

        sources:
            existingSources,
    };
}

export function validateAdminProduct(
    product: AdminProduct
) {
    if (!product.handle) {
        return (
            "Product handle is required."
        );
    }

    if (!product.title) {
        return (
            `${product.handle}: ` +
            "product title is required."
        );
    }

    if (
        !Array.isArray(
            product.tags
        ) ||
        !product.tags.length
    ) {
        return (
            `${product.handle}: ` +
            "at least one tag / collection is required."
        );
    }

    if (
        !Array.isArray(
            product.variants
        ) ||
        !product.variants.length
    ) {
        return (
            `${product.handle}: ` +
            "at least one variant is required."
        );
    }

    for (
        let index = 0;
        index <
        product.variants.length;
        index++
    ) {
        const variant =
            product.variants[
                index
            ];

        if (
            !clean(
                variant.partNumber
            )
        ) {
            return (
                `${product.handle}, ` +
                `variant ${index + 1}: ` +
                "part number is required."
            );
        }

        if (
            !clean(
                variant.title
            )
        ) {
            return (
                `${product.handle}, ` +
                `variant ${index + 1}: ` +
                "title is required."
            );
        }
    }

    return "";
}

export function productFolder(
    handle: string
) {
    let hash = 0;

    for (
        let index = 0;
        index <
        handle.length;
        index++
    ) {
        hash =
            (
                hash * 31 +
                handle.charCodeAt(
                    index
                )
            ) >>> 0;
    }

    return (
        hash % 256
    )
        .toString(16)
        .padStart(
            2,
            "0"
        );
}

export function productKey(
    handle: string
) {
    const safeHandle =
        slugify(handle);

    return (
        "catalog/products/" +
        `${productFolder(
            safeHandle
        )}/` +
        `${safeHandle}.json`
    );
}

/*
 * Legacy admin product path.
 *
 * Older admin-created products used a different
 * hash-folder algorithm. Keep this only for
 * backwards-compatible lookup/delete/update.
 */
export function legacyProductFolder(
    handle: string
) {
    const safeHandle =
        slugify(handle);

    let hash = 0;

    for (
        let index = 0;
        index < safeHandle.length;
        index++
    ) {
        hash =
            (
                (hash << 5) -
                hash +
                safeHandle.charCodeAt(
                    index
                )
            ) | 0;
    }

    return Math.abs(hash)
        .toString(16)
        .padStart(2, "0")
        .slice(0, 2);
}

export function legacyProductKey(
    handle: string
) {
    const safeHandle =
        slugify(handle);

    return (
        "catalog/products/" +
        `${legacyProductFolder(
            safeHandle
        )}/` +
        `${safeHandle}.json`
    );
}

/*
 * All possible master-product locations.
 *
 * Canonical path is always first.
 * Duplicate keys are removed because some
 * handles can produce the same folder under
 * both hash algorithms.
 */
export function productKeys(
    handle: string
) {
    return unique([
        productKey(handle),
        legacyProductKey(handle),
    ]);
}