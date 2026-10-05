import {
    getRequestContext,
} from "@cloudflare/next-on-pages";

import {
    type R2BucketLike,
} from "@/lib/admin/product-sync";

import {
    productKeys,
} from "@/lib/admin/product-normalize";

export const runtime = "edge";

type CatalogIndexItem = {
    handle?: string;
    h?: string;
};

type ProductMedia = {
    src?: string;
    position?: number;
    altText?: string;
};

type ProductVariant = {
    id?: string;

    title?: string;

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

type Product = {
    handle?: string;
    title?: string;
    bodyHtml?: string;

    vendor?: string;
    type?: string;

    collection?: string;
    category?: string;

    categoryId?: string;
    categoryName?: string;

    tags?: string[];
    customCollections?: string[];

    status?: string;

    published?: boolean;
    publishedAt?: string;

    templateSuffix?: string;
    giftCard?: boolean;

    images?: string[];
    media?: ProductMedia[];

    variants?: ProductVariant[];
};

function getBucket() {
    const context =
        getRequestContext();

    const env =
        context.env as unknown as {
            CATALOG_BUCKET?: R2BucketLike;
        };

    if (!env.CATALOG_BUCKET) {
        throw new Error(
            "CATALOG_BUCKET binding is not configured."
        );
    }

    return env.CATALOG_BUCKET;
}

function clean(
    value: unknown
) {
    return String(
        value ?? ""
    ).trim();
}

function boolText(
    value: unknown,
    fallback = false
) {
    if (
        typeof value ===
        "boolean"
    ) {
        return value
            ? "TRUE"
            : "FALSE";
    }

    return fallback
        ? "TRUE"
        : "FALSE";
}

function numberOrBlank(
    value: unknown
) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "";
    }

    const number =
        Number(value);

    return Number.isFinite(
        number
    )
        ? number
        : "";
}

function listText(
    value: unknown
) {
    if (!Array.isArray(value)) {
        return "";
    }

    return value
        .map(clean)
        .filter(Boolean)
        .join(", ");
}

function specificationsText(
    value: unknown
) {
    if (!Array.isArray(value)) {
        return "";
    }

    return value
        .map(clean)
        .filter(Boolean)
        .join(" | ");
}

async function readJson(
    object: any
) {
    return JSON.parse(
        await object.text()
    );
}

function extractHandles(
    value: unknown
) {
    const handles =
        new Set<string>();

    const visit = (
        node: unknown
    ) => {
        if (!node) {
            return;
        }

        if (
            typeof node ===
            "string"
        ) {
            return;
        }

        if (
            Array.isArray(node)
        ) {
            for (
                const item of node
            ) {
                visit(item);
            }

            return;
        }

        if (
            typeof node !==
            "object"
        ) {
            return;
        }

        const record =
            node as Record<
                string,
                unknown
            >;

        const handle =
            clean(
                record.handle ??
                record.h
            )
                .toLowerCase();

        if (handle) {
            handles.add(
                handle
            );
        }

        /*
         * catalog-index.json has changed
         * shape during the lifetime of the
         * catalogue. Recursively inspecting
         * arrays/objects lets export work with
         * both old and current index shapes.
         */
        for (
            const child of
            Object.values(record)
        ) {
            if (
                child &&
                typeof child ===
                "object"
            ) {
                visit(child);
            }
        }
    };

    visit(value);

    return Array.from(
        handles
    );
}

function emptyRow(): Record<
    string,
    string | number
> {
    return {
        Handle: "",
        Command: "",

        Title: "",
        "Body HTML": "",

        Vendor: "",
        Type: "",

        Tags: "",
        "Tags Command": "",

        Status: "",

        Published: "",
        "Published At": "",
        "Published Scope": "",

        "Template Suffix": "",
        "Gift Card": "",

        "Category ID": "",
        "Category Name": "",
        Category: "",

        "Custom Collections": "",

        "Image Attachment": "",
        "Image Src": "",
        "Image Command": "",
        "Image Position": "",
        "Image Alt Text": "",

        "Variant ID": "",
        "Variant Command": "",

        "Option1 Name": "",
        "Option1 Value": "",

        "Option2 Name": "",
        "Option2 Value": "",

        "Option3 Name": "",
        "Option3 Value": "",

        "Variant Generate From Options":
            "",

        "Variant Position": "",

        "Variant SKU": "",
        "Variant Barcode": "",

        "Variant Image": "",

        "Variant Weight": "",
        "Variant Weight Unit": "",

        "Variant Price": "",
        "Variant Compare At Price":
            "",
        "Variant Cost": "",

        "Variant Taxable": "",
        "Variant Tax Code": "",

        "Variant Inventory Tracker":
            "",
        "Variant Inventory Policy":
            "",
        "Variant Fulfillment Service":
            "",

        "Variant Requires Shipping":
            "",
        "Variant Shipping Profile":
            "",

        "Variant Inventory Qty":
            "",
        "Variant Inventory Adjust":
            "",

        "Variant Metafield: custom.hs_code [single_line_text_field]":
            "",

        "Variant Metafield: custom.country_of_origin [single_line_text_field]":
            "",

        "Variant Metafield: custom.brand_description [multi_line_text_field]":
            "",

        "Variant Metafield: custom.specification [list.single_line_text_field]":
            "",

        "Variant Metafield: custom.part_number [single_line_text_field]":
            "",

        "Variant Metafield: custom.unit_weight [single_line_text_field]":
            "",

        "Variant Metafield: custom.shipping_volume [single_line_text_field]":
            "",

        "Variant Metafield: custom.vendor [single_line_text_field]":
            "",
    };
}

function buildRows(
    product: Product
) {
    const rows:
        Array<
            ReturnType<
                typeof emptyRow
            >
        > = [];

    const handle =
        clean(
            product.handle
        );

    const images =
        Array.isArray(
            product.images
        )
            ? product.images
                .map(clean)
                .filter(Boolean)
            : [];

    const media =
        Array.isArray(
            product.media
        )
            ? product.media
            : [];

    const variants =
        Array.isArray(
            product.variants
        )
            ? product.variants
            : [];

    const mediaBySrc =
        new Map<
            string,
            ProductMedia
        >();

    for (
        const item of media
    ) {
        const src =
            clean(item?.src);

        if (src) {
            mediaBySrc.set(
                src,
                item
            );
        }
    }

    const rowCount =
        Math.max(
            variants.length,
            images.length,
            1
        );

    for (
        let index = 0;
        index < rowCount;
        index++
    ) {
        const row =
            emptyRow();

        const variant =
            variants[index];

        const image =
            images[index] || "";

        const mediaItem =
            image
                ? mediaBySrc.get(
                    image
                )
                : undefined;

        row.Handle =
            handle;

        /*
         * Product-level values are repeated
         * on every row intentionally.
         *
         * This makes the exported spreadsheet
         * safe to edit, filter, reorder and
         * import again without depending on
         * blank continuation cells.
         */
        row.Command =
            "MERGE";

        row.Title =
            clean(
                product.title
            );

        row["Body HTML"] =
            clean(
                product.bodyHtml
            );

        row.Vendor =
            clean(
                product.vendor
            );

        row.Type =
            clean(
                product.type
            );

        row.Tags =
            listText(
                product.tags
            );

        row["Tags Command"] =
            "REPLACE";

        row.Status =
            clean(
                product.status
            ) || "active";

        row.Published =
            boolText(
                product.published,
                true
            );

        row["Published At"] =
            clean(
                product.publishedAt
            );

        row["Published Scope"] =
            "web";

        row["Template Suffix"] =
            clean(
                product.templateSuffix
            );

        row["Gift Card"] =
            boolText(
                product.giftCard,
                false
            );

        row["Category ID"] =
            clean(
                product.categoryId
            );

        row["Category Name"] =
            clean(
                product.categoryName
            );

        row.Category =
            clean(
                product.category
            );

        row["Custom Collections"] =
            listText(
                product
                    .customCollections
            );

        if (image) {
            row["Image Src"] =
                image;

            row["Image Position"] =
                String(
                    mediaItem?.position ??
                    index + 1
                );

            row["Image Alt Text"] =
                clean(
                    mediaItem
                        ?.altText
                );
        }

        if (variant) {
            row["Variant ID"] =
                clean(
                    variant.id
                );

            row["Variant Command"] =
                "MERGE";

            row["Option1 Name"] =
                clean(
                    variant
                        .option1Name
                );

            row["Option1 Value"] =
                clean(
                    variant
                        .option1Value
                );

            row["Option2 Name"] =
                clean(
                    variant
                        .option2Name
                );

            row["Option2 Value"] =
                clean(
                    variant
                        .option2Value
                );

            row["Option3 Name"] =
                clean(
                    variant
                        .option3Name
                );

            row["Option3 Value"] =
                clean(
                    variant
                        .option3Value
                );

            row[
                "Variant Generate From Options"
            ] =
                "FALSE";

            row["Variant Position"] =
                variant.position ??
                index + 1;

            row["Variant SKU"] =
                clean(
                    variant.sku
                );

            row["Variant Barcode"] =
                clean(
                    variant.barcode
                );

            row["Variant Image"] =
                clean(
                    variant.image
                );

            row["Variant Weight"] =
                numberOrBlank(
                    variant.weight
                );

            row["Variant Weight Unit"] =
                clean(
                    variant
                        .weightUnit
                );

            row["Variant Price"] =
                numberOrBlank(
                    variant.price
                );

            row[
                "Variant Compare At Price"
            ] =
                numberOrBlank(
                    variant
                        .compareAtPrice
                );

            row["Variant Cost"] =
                numberOrBlank(
                    variant.cost
                );

            row["Variant Taxable"] =
                boolText(
                    variant.taxable,
                    true
                );

            row["Variant Tax Code"] =
                clean(
                    variant.taxCode
                );

            row[
                "Variant Inventory Tracker"
            ] =
                clean(
                    variant
                        .inventoryTracker
                );

            row[
                "Variant Inventory Policy"
            ] =
                clean(
                    variant
                        .inventoryPolicy
                );

            row[
                "Variant Fulfillment Service"
            ] =
                "";

            row[
                "Variant Requires Shipping"
            ] =
                boolText(
                    variant
                        .requiresShipping,
                    true
                );

            row[
                "Variant Shipping Profile"
            ] =
                clean(
                    variant
                        .shippingProfile
                );

            row[
                "Variant Inventory Qty"
            ] =
                numberOrBlank(
                    variant
                        .inventoryQty
                );

            row[
                "Variant Inventory Adjust"
            ] =
                "";

            row[
                "Variant Metafield: custom.hs_code [single_line_text_field]"
            ] =
                clean(
                    variant.hsCode
                );

            row[
                "Variant Metafield: custom.country_of_origin [single_line_text_field]"
            ] =
                clean(
                    variant
                        .countryOfOrigin
                );

            row[
                "Variant Metafield: custom.brand_description [multi_line_text_field]"
            ] =
                clean(
                    variant
                        .description
                );

            row[
                "Variant Metafield: custom.specification [list.single_line_text_field]"
            ] =
                specificationsText(
                    variant
                        .specifications
                );

            row[
                "Variant Metafield: custom.part_number [single_line_text_field]"
            ] =
                clean(
                    variant
                        .partNumber
                );

            row[
                "Variant Metafield: custom.unit_weight [single_line_text_field]"
            ] =
                clean(
                    variant
                        .unitWeight
                );

            row[
                "Variant Metafield: custom.shipping_volume [single_line_text_field]"
            ] =
                clean(
                    variant
                        .shippingVolume
                );

            row[
                "Variant Metafield: custom.vendor [single_line_text_field]"
            ] =
                clean(
                    variant.vendor
                );
        }

        rows.push(row);
    }

    return rows;
}

export async function GET() {
    try {
        const bucket =
            getBucket();

        /*
         * The catalogue index is used only
         * to discover handles.
         *
         * The actual export data always comes
         * from each master product JSON.
         */
        const indexObject =
            await bucket.get(
                "catalog/indexes/catalog-index.json"
            );

        if (!indexObject) {
            return Response.json(
                {
                    success: false,
                    error:
                        "Catalog index not found.",
                },
                {
                    status: 404,
                }
            );
        }

        const indexJson =
            await readJson(
                indexObject
            );

        const handles =
            extractHandles(
                indexJson
            );

        if (!handles.length) {
            return Response.json({
                success: true,
                productCount: 0,
                rowCount: 0,
                rows: [],
            });
        }

        const rows:
            Array<
                ReturnType<
                    typeof emptyRow
                >
            > = [];

        let productCount = 0;

        /*
         * Fetch in small groups rather than
         * issuing tens of thousands of R2
         * reads simultaneously.
         */
        const batchSize = 25;

        for (
            let start = 0;
            start <
            handles.length;
            start += batchSize
        ) {
            const batch =
                handles.slice(
                    start,
                    start +
                    batchSize
                );

            const products =
                await Promise.all(
                    batch.map(
                        async (
                            handle
                        ) => {
                            try {
                                let object:
                                    any = null;

                                const possibleKeys =
                                    productKeys(
                                        handle
                                    );

                                for (
                                    const possibleKey of
                                    possibleKeys
                                ) {
                                    const candidate =
                                        await bucket.get(
                                            possibleKey
                                        );

                                    if (candidate) {
                                        object =
                                            candidate;

                                        break;
                                    }
                                }

                                if (!object) {
                                    return null;
                                }

                                return (
                                    await readJson(
                                        object
                                    )
                                ) as Product;
                            } catch (
                            error
                            ) {
                                console.error(
                                    `Unable to export ${handle}:`,
                                    error
                                );

                                return null;
                            }
                        }
                    )
                );

            for (
                const product of
                products
            ) {
                if (!product) {
                    continue;
                }

                productCount++;

                rows.push(
                    ...buildRows(
                        product
                    )
                );
            }
        }

        return Response.json({
            success: true,

            productCount,

            rowCount:
                rows.length,

            rows,
        });
    } catch (error) {
        console.error(
            "Admin product export failed:",
            error
        );

        return Response.json(
            {
                success: false,

                error:
                    error instanceof Error
                        ? error.message
                        : "Unable to export products.",
            },
            {
                status: 500,
            }
        );
    }
}