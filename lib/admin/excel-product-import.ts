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

export type ImportedVariant = {
    title: string;
    option1Value: string;
    image: string;
    vendor: string;
    price: number;
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
    collection: string;
    category: string;
    imageFolder: string;
    tags: string[];
    images: string[];
    variants: ImportedVariant[];
};

function clean(value: unknown) {
    return String(value ?? "").trim();
}

function slugify(value: string) {
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

function parsePrice(value: unknown) {
    const number = Number(
        clean(value).replace(/,/g, "")
    );

    return Number.isFinite(number)
        ? number
        : 0;
}

function splitTags(value: unknown) {
    return unique(
        clean(value)
            .split(",")
            .map(slugify)
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
        const parsed = JSON.parse(raw);

        if (Array.isArray(parsed)) {
            return unique(
                parsed.map((item) =>
                    clean(item)
                )
            );
        }
    } catch {
        // Continue with text parsing.
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
    );
}

function cleanTitle(value: string) {
    return clean(value)
        .split("| Replaces")[0]
        .split("| replaces")[0]
        .trim();
}

function imageFilename(
    value: string
) {
    return clean(value);
}

export async function parseProductExcel(
    file: File
): Promise<ImportedProduct[]> {
    const buffer =
        await file.arrayBuffer();

    const XLSX = window.XLSX;

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
        new Map<string, ImportedProduct>();

    for (const row of rows) {
        const rawHandle =
            getValue(row, ["Handle"]);

        const partNumber =
            getValue(row, [
                "Variant Metafield: custom.part_number [single_line_text_field]",
            ]);

        const handle =
            slugify(
                rawHandle ||
                partNumber
            );

        if (!handle) {
            continue;
        }

        const rowTags =
            splitTags(
                getValue(row, ["Tags"])
            );

        const category =
            slugify(
                getValue(row, [
                    "Category",
                    "Category: Name",
                ])
            );

        /*
         * Every tag is a collection.
         *
         * The first tag is also used as the
         * legacy primary collection and the
         * permanent image folder.
         *
         * If Tags is empty, Category can act
         * as the fallback collection.
         */
        const rowCollections =
            unique([
                ...rowTags,
                category,
            ])
                .map(slugify)
                .filter(Boolean);

        if (!products.has(handle)) {
            const primaryCollection =
                rowCollections[0] || "";

            products.set(handle, {
                handle,

                title:
                    getValue(row, ["Title"]) ||
                    partNumber ||
                    handle,

                collection:
                    primaryCollection,

                category:
                    category ||
                    primaryCollection,

                imageFolder:
                    primaryCollection,

                tags:
                    rowCollections,

                images: [],

                variants: [],
            });
        }

        const product =
            products.get(handle)!;

        /*
         * A later variant row may contain
         * additional tags.
         */
        product.tags =
            unique([
                ...product.tags,
                ...rowCollections,
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

        const option1Value =
            getValue(row, [
                "Option1 Value",
            ]);

        const rawImage =
            getValue(row, [
                "Variant Image",
                "Image Src",
            ]);

        const image =
            imageFilename(rawImage);

        if (
            image &&
            !product.images.includes(image)
        ) {
            product.images.push(image);
        }

        product.variants.push({
            title:
                cleanTitle(option1Value) ||
                partNumber ||
                product.title,

            option1Value,

            image,

            vendor:
                getValue(row, [
                    "Variant Metafield: custom.vendor [single_line_text_field]",
                    "Vendor",
                ]),

            price:
                parsePrice(
                    getValue(row, [
                        "Variant Price",
                    ])
                ),

            partNumber,

            hsCode:
                getValue(row, [
                    "Variant Metafield: custom.hs_code [single_line_text_field]",
                ]),

            countryOfOrigin:
                getValue(row, [
                    "Variant Metafield: custom.country_of_origin [single_line_text_field]",
                ]),

            description:
                getValue(row, [
                    "Variant Metafield: custom.brand_description [multi_line_text_field]",
                    "Body HTML",
                ]),

            specifications:
                splitSpecifications(
                    getValue(row, [
                        "Variant Metafield: custom.specification [list.single_line_text_field]",
                    ])
                ),

            unitWeight:
                getValue(row, [
                    "Variant Metafield: custom.unit_weight [single_line_text_field]",
                ]),

            shippingVolume:
                getValue(row, [
                    "Variant Metafield: custom.shipping_volume [single_line_text_field]",
                ]),
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
        if (!product.tags.length) {
            throw new Error(
                `${product.handle}: no Tags or Category found.`
            );
        }

        if (!product.variants.length) {
            throw new Error(
                `${product.handle}: no variants found.`
            );
        }
    }

    return result;
}