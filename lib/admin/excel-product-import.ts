declare global {
    interface Window {
        XLSX?: {
            read: (
                data: ArrayBuffer,
                options: { type: "array" }
            ) => {
                SheetNames: string[];
                Sheets: Record<string, unknown>;
            };

            utils: {
                sheet_to_json: <T>(
                    sheet: unknown,
                    options: { defval: string }
                ) => T[];
            };
        };
    }
}

type ExcelRow = Record<string, unknown>;

export type ImportedMedia = {
    src: string;
    position: number;
    altText: string;
};

export type ImportedVariant = {
    id: string;

    title: string;

    option1Name: string;
    option1Value: string;

    option2Name: string;
    option2Value: string;

    option3Name: string;
    option3Value: string;

    position: number;

    sku: string;
    barcode: string;
    image: string;

    weight: number;
    weightUnit: string;

    price: number;
    compareAtPrice: number;
    cost: number;

    taxable: boolean;
    taxCode: string;

    inventoryTracker: string;
    inventoryPolicy: string;
    inventoryQty: number;

    requiresShipping: boolean;
    shippingProfile: string;

    vendor: string;
    partNumber: string;

    hsCode: string;
    countryOfOrigin: string;

    description: string;
    specifications: string[];

    unitWeight: string;
    shippingVolume: string;
};

export type ImportedProduct = {
    handle: string;

    title: string;
    bodyHtml: string;

    vendor: string;
    type: string;

    collection: string;
    category: string;

    categoryId: string;
    categoryName: string;

    imageFolder: string;

    tags: string[];
    customCollections: string[];

    status: string;

    published: boolean;
    publishedAt: string;

    templateSuffix: string;
    giftCard: boolean;

    images: string[];
    media: ImportedMedia[];

    variants: ImportedVariant[];
};

function clean(value: unknown) {
    return String(value ?? "").trim();
}

function slugify(value: unknown) {
    return clean(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function unique(values: string[]) {
    return Array.from(
        new Set(
            values
                .map((value) => clean(value))
                .filter(Boolean)
        )
    );
}

function getValue(
    row: ExcelRow,
    keys: string[]
) {
    for (const key of keys) {
        const value = clean(row[key]);

        if (value) {
            return value;
        }
    }

    return "";
}

function parseNumber(
    value: unknown,
    fallback = 0
) {
    const raw = clean(value)
        .replace(/,/g, "");

    if (!raw) {
        return fallback;
    }

    const number = Number(raw);

    return Number.isFinite(number)
        ? number
        : fallback;
}

function parseInteger(
    value: unknown,
    fallback = 0
) {
    const number =
        parseNumber(value, fallback);

    return Number.isFinite(number)
        ? Math.trunc(number)
        : fallback;
}

function parseBoolean(
    value: unknown,
    fallback = false
) {
    const raw =
        clean(value).toLowerCase();

    if (!raw) {
        return fallback;
    }

    if (
        [
            "true",
            "yes",
            "y",
            "1",
            "published",
            "active",
        ].includes(raw)
    ) {
        return true;
    }

    if (
        [
            "false",
            "no",
            "n",
            "0",
            "unpublished",
            "draft",
        ].includes(raw)
    ) {
        return false;
    }

    return fallback;
}

function splitTags(value: unknown) {
    return unique(
        clean(value)
            .split(",")
            .map((item) =>
                slugify(item)
            )
            .filter(Boolean)
    );
}

function splitCollections(
    value: unknown
) {
    return unique(
        clean(value)
            .split(/,|\|/)
            .map((item) =>
                slugify(item)
            )
            .filter(Boolean)
    );
}

function splitSpecifications(
    value: unknown
) {
    const raw = clean(value);

    if (!raw) {
        return [];
    }

    try {
        const parsed =
            JSON.parse(raw);

        if (Array.isArray(parsed)) {
            return unique(
                parsed.map((item) =>
                    clean(item)
                )
            );
        }
    } catch {
        // Continue with normal text parsing.
    }

    return unique(
        raw
            .replace(/^\[|\]$/g, "")
            .split(/\n|\|/)
            .map((item) =>
                item
                    .replace(/^"|"$/g, "")
                    .trim()
            )
            .filter(Boolean)
    );
}

function cleanTitle(value: string) {
    return clean(value)
        .split("| Replaces")[0]
        .split("| replaces")[0]
        .trim();
}

function imageFilename(
    value: unknown
) {
    return clean(value);
}

function normalizeStatus(
    value: unknown
) {
    const status =
        clean(value).toLowerCase();

    if (
        status === "active" ||
        status === "draft" ||
        status === "archived"
    ) {
        return status;
    }

    return status || "active";
}

function createVariantTitle({
    option1Value,
    option2Value,
    option3Value,
    partNumber,
    productTitle,
}: {
    option1Value: string;
    option2Value: string;
    option3Value: string;
    partNumber: string;
    productTitle: string;
}) {
    const options =
        [
            option1Value,
            option2Value,
            option3Value,
        ]
            .map(cleanTitle)
            .filter(Boolean);

    if (options.length) {
        return options.join(" / ");
    }

    return (
        partNumber ||
        productTitle
    );
}

export async function parseProductExcel(
    file: File
): Promise<ImportedProduct[]> {
    const buffer =
        await file.arrayBuffer();

    const XLSX =
        window.XLSX;

    if (!XLSX) {
        throw new Error(
            "Excel reader is not loaded. Please refresh the page and try again."
        );
    }

    const workbook =
        XLSX.read(buffer, {
            type: "array",
        });

    const firstSheet =
        workbook.SheetNames[0];

    if (!firstSheet) {
        throw new Error(
            "The Excel file does not contain a worksheet."
        );
    }

    const sheet =
        workbook.Sheets[firstSheet];

    const rows =
        XLSX.utils.sheet_to_json<ExcelRow>(
            sheet,
            {
                defval: "",
            }
        );

    if (!rows.length) {
        throw new Error(
            "The Excel file contains no product rows."
        );
    }

    const products =
        new Map<
            string,
            ImportedProduct
        >();

    for (
        let rowIndex = 0;
        rowIndex < rows.length;
        rowIndex++
    ) {
        const row =
            rows[rowIndex];

        const rawHandle =
            getValue(
                row,
                ["Handle"]
            );

        const partNumber =
            getValue(
                row,
                [
                    "Variant Metafield: custom.part_number [single_line_text_field]",
                    "Variant SKU",
                ]
            );

        const handle =
            slugify(
                rawHandle ||
                partNumber
            );

        /*
         * Shopify-style files can have
         * continuation image rows where the
         * handle is repeated.
         *
         * Rows without a usable handle or
         * part number cannot safely be mapped
         * to a product, so they are ignored.
         */
        if (!handle) {
            continue;
        }

        const rowTags =
            splitTags(
                getValue(
                    row,
                    ["Tags"]
                )
            );

        const categoryName =
            getValue(
                row,
                [
                    "Category: Name",
                    "Category",
                ]
            );

        const category =
            slugify(
                getValue(
                    row,
                    [
                        "Category",
                        "Category: Name",
                    ]
                )
            );

        const customCollections =
            splitCollections(
                getValue(
                    row,
                    [
                        "Custom Collections",
                    ]
                )
            );

        /*
         * Sparesco currently treats tags as
         * collection handles.
         *
         * Keep that behaviour intact while
         * also preserving Custom Collections.
         */
        const rowCollections =
            unique([
                ...rowTags,
                ...customCollections,
                category,
            ])
                .map(slugify)
                .filter(Boolean);

        if (!products.has(handle)) {
            const primaryCollection =
                rowCollections[0] || "";

            products.set(
                handle,
                {
                    handle,

                    title:
                        getValue(
                            row,
                            ["Title"]
                        ) ||
                        partNumber ||
                        handle,

                    bodyHtml:
                        getValue(
                            row,
                            ["Body HTML"]
                        ),

                    vendor:
                        getValue(
                            row,
                            ["Vendor"]
                        ),

                    type:
                        getValue(
                            row,
                            ["Type"]
                        ),

                    collection:
                        primaryCollection,

                    category:
                        category ||
                        primaryCollection,

                    categoryId:
                        getValue(
                            row,
                            ["Category: ID"]
                        ),

                    categoryName:
                        categoryName,

                    imageFolder:
                        primaryCollection,

                    tags:
                        rowCollections,

                    customCollections:
                        customCollections,

                    status:
                        normalizeStatus(
                            getValue(
                                row,
                                ["Status"]
                            )
                        ),

                    published:
                        parseBoolean(
                            getValue(
                                row,
                                ["Published"]
                            ),
                            true
                        ),

                    publishedAt:
                        getValue(
                            row,
                            [
                                "Published At",
                            ]
                        ),

                    templateSuffix:
                        getValue(
                            row,
                            [
                                "Template Suffix",
                            ]
                        ),

                    giftCard:
                        parseBoolean(
                            getValue(
                                row,
                                ["Gift Card"]
                            ),
                            false
                        ),

                    images: [],

                    media: [],

                    variants: [],
                }
            );
        }

        const product =
            products.get(handle)!;

        /*
         * Later rows can contain extra tags
         * or collection assignments.
         */
        product.tags =
            unique([
                ...product.tags,
                ...rowCollections,
            ])
                .map(slugify)
                .filter(Boolean);

        product.customCollections =
            unique([
                ...product.customCollections,
                ...customCollections,
            ])
                .map(slugify)
                .filter(Boolean);

        if (
            !product.collection &&
            product.tags.length
        ) {
            product.collection =
                product.tags[0];
        }

        if (
            !product.imageFolder &&
            product.collection
        ) {
            product.imageFolder =
                product.collection;
        }

        if (
            !product.category &&
            category
        ) {
            product.category =
                category;
        }

        if (
            !product.categoryName &&
            categoryName
        ) {
            product.categoryName =
                categoryName;
        }

        /*
         * -----------------------------
         * PRODUCT MEDIA
         * -----------------------------
         */

        const imageSrc =
            imageFilename(
                getValue(
                    row,
                    [
                        "Image Src",
                        "Image Attachment",
                    ]
                )
            );

        if (imageSrc) {
            if (
                !product.images.includes(
                    imageSrc
                )
            ) {
                product.images.push(
                    imageSrc
                );
            }

            const existingMedia =
                product.media.find(
                    (item) =>
                        item.src ===
                        imageSrc
                );

            const imagePosition =
                parseInteger(
                    getValue(
                        row,
                        [
                            "Image Position",
                        ]
                    ),
                    product.media.length + 1
                );

            const imageAltText =
                getValue(
                    row,
                    [
                        "Image Alt Text",
                    ]
                );

            if (existingMedia) {
                if (
                    imagePosition > 0
                ) {
                    existingMedia.position =
                        imagePosition;
                }

                if (imageAltText) {
                    existingMedia.altText =
                        imageAltText;
                }
            } else {
                product.media.push({
                    src: imageSrc,

                    position:
                        imagePosition > 0
                            ? imagePosition
                            : product.media.length +
                              1,

                    altText:
                        imageAltText,
                });
            }
        }

        /*
         * -----------------------------
         * VARIANT
         * -----------------------------
         *
         * Do not create a fake variant for
         * an image-only continuation row.
         */

        const option1Name =
            getValue(
                row,
                ["Option1 Name"]
            );

        const option1Value =
            getValue(
                row,
                ["Option1 Value"]
            );

        const option2Name =
            getValue(
                row,
                ["Option2 Name"]
            );

        const option2Value =
            getValue(
                row,
                ["Option2 Value"]
            );

        const option3Name =
            getValue(
                row,
                ["Option3 Name"]
            );

        const option3Value =
            getValue(
                row,
                ["Option3 Value"]
            );

        const variantId =
            getValue(
                row,
                ["Variant ID"]
            );

        const sku =
            getValue(
                row,
                ["Variant SKU"]
            );

        const barcode =
            getValue(
                row,
                ["Variant Barcode"]
            );

        const variantImage =
            imageFilename(
                getValue(
                    row,
                    ["Variant Image"]
                )
            );

        const hasVariantData =
            Boolean(
                variantId ||
                partNumber ||
                sku ||
                barcode ||
                option1Value ||
                option2Value ||
                option3Value ||
                getValue(
                    row,
                    ["Variant Price"]
                )
            );

        if (!hasVariantData) {
            continue;
        }

        const resolvedVariantImage =
            variantImage ||
            imageSrc;

        if (
            resolvedVariantImage &&
            !product.images.includes(
                resolvedVariantImage
            )
        ) {
            product.images.push(
                resolvedVariantImage
            );
        }

        product.variants.push({
            id:
                variantId,

            title:
                createVariantTitle({
                    option1Value,
                    option2Value,
                    option3Value,
                    partNumber,
                    productTitle:
                        product.title,
                }),

            option1Name,
            option1Value,

            option2Name,
            option2Value,

            option3Name,
            option3Value,

            position:
                parseInteger(
                    getValue(
                        row,
                        [
                            "Variant Position",
                        ]
                    ),
                    product.variants.length +
                        1
                ),

            sku,

            barcode,

            image:
                resolvedVariantImage,

            weight:
                parseNumber(
                    getValue(
                        row,
                        [
                            "Variant Weight",
                        ]
                    )
                ),

            weightUnit:
                getValue(
                    row,
                    [
                        "Variant Weight Unit",
                    ]
                ),

            price:
                parseNumber(
                    getValue(
                        row,
                        [
                            "Variant Price",
                        ]
                    )
                ),

            compareAtPrice:
                parseNumber(
                    getValue(
                        row,
                        [
                            "Variant Compare At Price",
                        ]
                    )
                ),

            cost:
                parseNumber(
                    getValue(
                        row,
                        [
                            "Variant Cost",
                        ]
                    )
                ),

            taxable:
                parseBoolean(
                    getValue(
                        row,
                        [
                            "Variant Taxable",
                        ]
                    ),
                    true
                ),

            taxCode:
                getValue(
                    row,
                    [
                        "Variant Tax Code",
                    ]
                ),

            inventoryTracker:
                getValue(
                    row,
                    [
                        "Variant Inventory Tracker",
                    ]
                ),

            inventoryPolicy:
                getValue(
                    row,
                    [
                        "Variant Inventory Policy",
                    ]
                ),

            inventoryQty:
                parseInteger(
                    getValue(
                        row,
                        [
                            "Variant Inventory Qty",
                        ]
                    )
                ),

            requiresShipping:
                parseBoolean(
                    getValue(
                        row,
                        [
                            "Variant Requires Shipping",
                        ]
                    ),
                    true
                ),

            shippingProfile:
                getValue(
                    row,
                    [
                        "Variant Shipping Profile",
                    ]
                ),

            vendor:
                getValue(
                    row,
                    [
                        "Variant Metafield: custom.vendor [single_line_text_field]",
                        "Vendor",
                    ]
                ),

            partNumber,

            hsCode:
                getValue(
                    row,
                    [
                        "Variant Metafield: custom.hs_code [single_line_text_field]",
                    ]
                ),

            countryOfOrigin:
                getValue(
                    row,
                    [
                        "Variant Metafield: custom.country_of_origin [single_line_text_field]",
                    ]
                ),

            description:
                getValue(
                    row,
                    [
                        "Variant Metafield: custom.brand_description [multi_line_text_field]",
                        "Body HTML",
                    ]
                ),

            specifications:
                splitSpecifications(
                    getValue(
                        row,
                        [
                            "Variant Metafield: custom.specification [list.single_line_text_field]",
                        ]
                    )
                ),

            unitWeight:
                getValue(
                    row,
                    [
                        "Variant Metafield: custom.unit_weight [single_line_text_field]",
                    ]
                ),

            shippingVolume:
                getValue(
                    row,
                    [
                        "Variant Metafield: custom.shipping_volume [single_line_text_field]",
                    ]
                ),
        });
    }

    const result =
        Array.from(
            products.values()
        );

    if (!result.length) {
        throw new Error(
            "No valid products were found. Each product requires a Handle or Part Number."
        );
    }

    for (const product of result) {
        /*
         * Sort media and variants using the
         * positions supplied by the spreadsheet.
         */
        product.media.sort(
            (a, b) =>
                a.position -
                b.position
        );

        product.variants.sort(
            (a, b) =>
                a.position -
                b.position
        );

        /*
         * Keep the legacy images[] array in
         * exactly the same order as media.
         * Any variant-only images are appended.
         */
        const orderedMediaImages =
            product.media.map(
                (item) => item.src
            );

        product.images =
            unique([
                ...orderedMediaImages,
                ...product.images,
            ]);

        if (!product.tags.length) {
            throw new Error(
                `${product.handle}: no Tags, Custom Collections or Category found.`
            );
        }

        if (!product.variants.length) {
            throw new Error(
                `${product.handle}: no variants found.`
            );
        }

        for (
            let index = 0;
            index <
            product.variants.length;
            index++
        ) {
            const variant =
                product.variants[index];

            if (!variant.partNumber) {
                throw new Error(
                    `${product.handle}, variant ${index + 1}: Part Number is required.`
                );
            }

            if (!variant.title) {
                variant.title =
                    variant.partNumber ||
                    product.title;
            }
        }
    }

    return result;
}

export {};