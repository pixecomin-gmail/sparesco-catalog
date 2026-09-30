"use client";

import {
    ChangeEvent,
    useMemo,
    useRef,
    useState,
} from "react";

import type {
    ImportedProduct,
} from "@/lib/admin/excel-product-import";

type ProductVariant = {
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

type NewProduct = {
    handle: string;
    title: string;
    collection: string;
    category: string;
    imageFolder: string;
    tags: string[];
    images: string[];
    variants: ProductVariant[];
};

function slugify(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function emptyVariant(): ProductVariant {
    return {
        title: "",
        option1Value: "",
        image: "",
        vendor: "",
        price: 0,
        partNumber: "",
        hsCode: "",
        countryOfOrigin: "",
        description: "",
        specifications: [],
        unitWeight: "",
        shippingVolume: "",
    };
}

let excelLibraryPromise: Promise<void> | null = null;

function loadExcelLibrary(): Promise<void> {
    if (typeof window === "undefined") {
        return Promise.reject(
            new Error(
                "Excel import is only available in the browser."
            )
        );
    }

    if (window.XLSX) {
        return Promise.resolve();
    }

    if (excelLibraryPromise) {
        return excelLibraryPromise;
    }

    excelLibraryPromise =
        new Promise<void>((resolve, reject) => {
            const existing =
                document.querySelector<HTMLScriptElement>(
                    'script[data-sparesco-xlsx="true"]'
                );

            if (existing) {
                existing.addEventListener(
                    "load",
                    () => resolve(),
                    { once: true }
                );

                existing.addEventListener(
                    "error",
                    () =>
                        reject(
                            new Error(
                                "Unable to load the Excel reader."
                            )
                        ),
                    { once: true }
                );

                return;
            }

            const script =
                document.createElement("script");

            script.src =
                "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";

            script.async = true;

            script.dataset.sparescoXlsx =
                "true";

            script.onload = () =>
                resolve();

            script.onerror = () =>
                reject(
                    new Error(
                        "Unable to load the Excel reader."
                    )
                );

            document.head.appendChild(script);
        });

    return excelLibraryPromise;
}

export default function AddProductClient() {
    const [product, setProduct] =
        useState<NewProduct>({
            handle: "",
            title: "",
            collection: "",
            category: "",
            imageFolder: "",
            tags: [],
            images: [],
            variants: [emptyVariant()],
        });

    const [tagInput, setTagInput] =
        useState("");

    const [handleEdited, setHandleEdited] =
        useState(false);

    const [activeVariant, setActiveVariant] =
        useState(0);

    const [pendingImages, setPendingImages] =
        useState<File[]>([]);

    const [isCreating, setIsCreating] =
        useState(false);

    const [excelFile, setExcelFile] =
        useState<File | null>(null);

    const [excelProducts, setExcelProducts] =
        useState<ImportedProduct[]>([]);

    const [isParsingExcel, setIsParsingExcel] =
        useState(false);

    const [excelError, setExcelError] =
        useState("");

    const [isImportingExcel, setIsImportingExcel] =
        useState(false);

    const [excelImportResult, setExcelImportResult] =
        useState<{
            importedCount: number;
            skippedCount: number;
            skipped: string[];
        } | null>(null);

    const imageInputRef =
        useRef<HTMLInputElement>(null);

    const previewUrls = useMemo(
        () =>
            pendingImages.map((file) => ({
                file,
                url: URL.createObjectURL(file),
            })),
        [pendingImages]
    );

    function updateProduct<
        K extends keyof NewProduct
    >(
        key: K,
        value: NewProduct[K]
    ) {
        setProduct((current) => ({
            ...current,
            [key]: value,
        }));
    }

    function updateVariant(
        index: number,
        field: keyof ProductVariant,
        value: string | number | string[]
    ) {
        setProduct((current) => ({
            ...current,
            variants: current.variants.map(
                (variant, variantIndex) =>
                    variantIndex === index
                        ? {
                            ...variant,
                            [field]: value,
                        }
                        : variant
            ),
        }));
    }

    function handleTitleChange(
        value: string
    ) {
        setProduct((current) => ({
            ...current,
            title: value,
            handle: handleEdited
                ? current.handle
                : slugify(value),
        }));
    }

    function handleHandleChange(
        value: string
    ) {
        setHandleEdited(true);

        updateProduct(
            "handle",
            slugify(value)
        );
    }

    function addTag() {
        const tag = slugify(tagInput);

        if (!tag) return;

        setProduct((current) => {
            if (current.tags.includes(tag)) {
                return current;
            }

            const tags = [
                ...current.tags,
                tag,
            ];

            /*
             * Keep collection/imageFolder for
             * compatibility with the existing
             * catalogue and image structure.
             *
             * The first tag becomes the primary
             * collection unless one already exists.
             */
            return {
                ...current,
                tags,
                collection:
                    current.collection || tag,
                imageFolder:
                    current.imageFolder || tag,
            };
        });

        setTagInput("");
    }

    function removeTag(tag: string) {
        setProduct((current) => {
            const tags =
                current.tags.filter(
                    (item) => item !== tag
                );

            let collection =
                current.collection;

            let imageFolder =
                current.imageFolder;

            if (collection === tag) {
                collection = tags[0] || "";
            }

            if (imageFolder === tag) {
                imageFolder =
                    collection ||
                    tags[0] ||
                    "";
            }

            return {
                ...current,
                tags,
                collection,
                imageFolder,
            };
        });
    }

    function addVariant() {
        setProduct((current) => ({
            ...current,
            variants: [
                ...current.variants,
                emptyVariant(),
            ],
        }));

        setActiveVariant(
            product.variants.length
        );
    }

    function removeVariant(
        index: number
    ) {
        if (product.variants.length <= 1) {
            alert(
                "A product must have at least one variant."
            );
            return;
        }

        if (
            !window.confirm(
                "Remove this variant?"
            )
        ) {
            return;
        }

        setProduct((current) => ({
            ...current,
            variants:
                current.variants.filter(
                    (_, variantIndex) =>
                        variantIndex !== index
                ),
        }));

        setActiveVariant((current) =>
            Math.max(
                0,
                Math.min(
                    current,
                    product.variants.length - 2
                )
            )
        );
    }

    function selectImages(
        event: ChangeEvent<HTMLInputElement>
    ) {
        const files =
            Array.from(
                event.target.files || []
            );

        if (!files.length) return;

        setPendingImages((current) => [
            ...current,
            ...files,
        ]);

        event.target.value = "";
    }

    function removePendingImage(
        index: number
    ) {
        setPendingImages((current) =>
            current.filter(
                (_, imageIndex) =>
                    imageIndex !== index
            )
        );
    }

    function makePrimaryImage(
        index: number
    ) {
        setPendingImages((current) => {
            if (
                index < 0 ||
                index >= current.length
            ) {
                return current;
            }

            const next = [...current];
            const [selected] =
                next.splice(index, 1);

            next.unshift(selected);

            return next;
        });
    }

    async function selectExcelFile(
        event: ChangeEvent<HTMLInputElement>
    ) {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        setExcelFile(file);
        setExcelProducts([]);
        setExcelError("");
        setExcelImportResult(null);
        setIsParsingExcel(true);

        try {
            await loadExcelLibrary();

            const {
                parseProductExcel,
            } = await import(
                "@/lib/admin/excel-product-import"
            );

            const products =
                await parseProductExcel(file);

            setExcelProducts(products);
        } catch (error) {
            console.error(
                "Excel parse error:",
                error
            );

            setExcelError(
                error instanceof Error
                    ? error.message
                    : "Unable to read Excel file."
            );
        } finally {
            setIsParsingExcel(false);
        }
    }

    async function importExcelProducts() {
        if (
            !excelFile ||
            !excelProducts.length ||
            isImportingExcel
        ) {
            return;
        }

        const confirmed =
            window.confirm(
                `Import ${excelProducts.length} products from ${excelFile.name}? Existing product handles will be skipped.`
            );

        if (!confirmed) {
            return;
        }

        setIsImportingExcel(true);
        setExcelError("");
        setExcelImportResult(null);

        try {
            const BATCH_SIZE = 100;

            let importedCount = 0;
            let skippedCount = 0;
            const skipped: string[] = [];

            for (
                let start = 0;
                start < excelProducts.length;
                start += BATCH_SIZE
            ) {
                const batch =
                    excelProducts.slice(
                        start,
                        start + BATCH_SIZE
                    );

                const response =
                    await fetch(
                        "/api/admin/import",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",
                            },

                            body:
                                JSON.stringify({
                                    products:
                                        batch.map(
                                            (item) => ({
                                                ...item,

                                                excelFile:
                                                    excelFile.name,
                                            })
                                        ),
                                }),
                        }
                    );

                const data =
                    await response.json();

                if (
                    !response.ok ||
                    !data?.success
                ) {
                    throw new Error(
                        data?.message ||
                        data?.error ||
                        `Import failed after processing ${start} products.`
                    );
                }

                importedCount +=
                    Number(
                        data.importedCount || 0
                    );

                skippedCount +=
                    Number(
                        data.skippedCount || 0
                    );

                if (
                    Array.isArray(
                        data.skipped
                    )
                ) {
                    skipped.push(
                        ...data.skipped
                    );
                }
            }

            setExcelImportResult({
                importedCount,
                skippedCount,
                skipped,
            });

            alert(
                `Excel import complete.\n\nImported: ${importedCount}\nSkipped existing: ${skippedCount}`
            );
        } catch (error) {
            console.error(
                "Excel import error:",
                error
            );

            setExcelError(
                error instanceof Error
                    ? error.message
                    : "Unable to import products."
            );
        } finally {
            setIsImportingExcel(false);
        }
    }

    function validateProduct() {
        if (!product.title.trim()) {
            return "Product title is required.";
        }

        if (!product.handle.trim()) {
            return "Product handle is required.";
        }

        if (!product.tags.length) {
            return "Add at least one collection/tag.";
        }

        if (!product.variants.length) {
            return "Add at least one variant.";
        }

        for (
            let index = 0;
            index < product.variants.length;
            index++
        ) {
            const variant =
                product.variants[index];

            if (!variant.partNumber.trim()) {
                return (
                    `Variant ${index + 1}: ` +
                    "Part number is required."
                );
            }

            if (!variant.title.trim()) {
                return (
                    `Variant ${index + 1}: ` +
                    "Variant title is required."
                );
            }
        }

        return "";
    }

    async function createProduct() {
        const error =
            validateProduct();

        if (error) {
            alert(error);
            return;
        }

        if (isCreating) {
            return;
        }

        setIsCreating(true);

        try {
            /*
             * --------------------------------
             * 1. UPLOAD PRODUCT IMAGES
             * --------------------------------
             */

            const imageMap =
                new Map<string, string>();

            const uploadedImages: string[] =
                [];

            if (pendingImages.length) {
                const formData =
                    new FormData();

                formData.append(
                    "imageFolder",
                    product.imageFolder ||
                    product.collection ||
                    product.tags[0]
                );

                for (
                    const file of pendingImages
                ) {
                    formData.append(
                        "files",
                        file
                    );
                }

                const uploadResponse =
                    await fetch(
                        `/api/admin/products/${encodeURIComponent(
                            product.handle
                        )}/images`,
                        {
                            method: "POST",
                            body: formData,
                        }
                    );

                const uploadData =
                    await uploadResponse.json();

                if (
                    !uploadResponse.ok ||
                    !uploadData?.success
                ) {
                    throw new Error(
                        uploadData?.error ||
                        "Unable to upload product images."
                    );
                }

                const uploaded =
                    Array.isArray(
                        uploadData.uploaded
                    )
                        ? uploadData.uploaded
                        : [];

                for (
                    const item of uploaded
                ) {
                    const originalFilename =
                        String(
                            item?.originalFilename ||
                            ""
                        );

                    const filename =
                        String(
                            item?.filename || ""
                        );

                    if (
                        originalFilename &&
                        filename
                    ) {
                        imageMap.set(
                            originalFilename,
                            filename
                        );
                    }

                    if (filename) {
                        uploadedImages.push(
                            filename
                        );
                    }
                }

                if (
                    uploadedImages.length !==
                    pendingImages.length
                ) {
                    throw new Error(
                        "Not all selected images were uploaded."
                    );
                }
            }

            /*
             * --------------------------------
             * 2. REPLACE LOCAL IMAGE NAMES
             *    WITH STORED R2 FILENAMES
             * --------------------------------
             */

            const finalVariants =
                product.variants.map(
                    (variant) => {
                        const selectedImage =
                            variant.image
                                ? imageMap.get(
                                    variant.image
                                ) || ""
                                : "";

                        if (
                            variant.image &&
                            !selectedImage
                        ) {
                            throw new Error(
                                `Could not match the selected image for variant "${variant.title}".`
                            );
                        }

                        return {
                            ...variant,
                            image:
                                selectedImage,
                        };
                    }
                );

            /*
             * --------------------------------
             * 3. CREATE PRODUCT
             * --------------------------------
             */

            const payload = {
                ...product,

                images:
                    uploadedImages,

                variants:
                    finalVariants,
            };

            const response =
                await fetch(
                    "/api/admin/products",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify(
                                payload
                            ),
                    }
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data?.success
            ) {
                throw new Error(
                    data?.error ||
                    data?.message ||
                    "Unable to create product."
                );
            }

            /*
             * --------------------------------
             * 4. SUCCESS
             * --------------------------------
             */

            alert(
                "Product created successfully."
            );

            window.location.href =
                `/admin/products/${encodeURIComponent(
                    data.handle ||
                    product.handle
                )}`;
        } catch (error) {
            console.error(
                "Create product error:",
                error
            );

            alert(
                error instanceof Error
                    ? error.message
                    : "Unable to create product."
            );
        } finally {
            setIsCreating(false);
        }
    }

    const variant =
        product.variants[
        activeVariant
        ] || product.variants[0];

    return (
        <main className="admin-dashboard">
            <div className="admin-page-heading">
                <div>
                    <h1>Add Product</h1>

                    <p>
                        Create a new product in the
                        Sparesco catalogue.
                    </p>
                </div>
            </div>

            <div
                className="admin-stat-card"
                style={{
                    marginBottom: 20,
                }}
            >
                <h2>Product Information</h2>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(260px, 1fr))",
                        gap: 16,
                    }}
                >
                    <label>
                        <strong>Title *</strong>

                        <input
                            type="text"
                            value={product.title}
                            onChange={(event) =>
                                handleTitleChange(
                                    event.target.value
                                )
                            }
                            placeholder="Example: SA 16056"
                        />
                    </label>

                    <label>
                        <strong>Handle *</strong>

                        <input
                            type="text"
                            value={product.handle}
                            onChange={(event) =>
                                handleHandleChange(
                                    event.target.value
                                )
                            }
                            placeholder="sa-16056"
                        />
                    </label>

                    <label>
                        <strong>Category</strong>

                        <input
                            type="text"
                            value={product.category}
                            onChange={(event) =>
                                updateProduct(
                                    "category",
                                    slugify(
                                        event.target.value
                                    )
                                )
                            }
                            placeholder="air-filter"
                        />
                    </label>
                </div>
            </div>

            <div
                className="admin-stat-card"
                style={{
                    marginBottom: 20,
                }}
            >
                <h2>Import from Excel</h2>

                <p>
                    Upload a Matrixify-style Excel file
                    to create multiple products and
                    variants.
                </p>

                <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={selectExcelFile}
                    disabled={isParsingExcel}
                />

                {isParsingExcel && (
                    <p
                        style={{
                            marginTop: 12,
                        }}
                    >
                        Reading Excel file...
                    </p>
                )}

                {excelError && (
                    <p
                        style={{
                            marginTop: 12,
                            fontWeight: 600,
                        }}
                    >
                        {excelError}
                    </p>
                )}

                {excelFile &&
                    !isParsingExcel &&
                    !excelError &&
                    excelProducts.length > 0 && (
                        <div
                            style={{
                                marginTop: 18,
                            }}
                        >
                            <p>
                                <strong>
                                    {excelFile.name}
                                </strong>
                            </p>

                            <p>
                                Products found:{" "}
                                <strong>
                                    {
                                        excelProducts.length
                                    }
                                </strong>
                            </p>

                            <p>
                                Variants found:{" "}
                                <strong>
                                    {excelProducts.reduce(
                                        (
                                            total,
                                            item
                                        ) =>
                                            total +
                                            item
                                                .variants
                                                .length,
                                        0
                                    )}
                                </strong>
                            </p>

                            <div
                                style={{
                                    marginTop: 16,
                                    overflowX: "auto",
                                }}
                            >
                                <table
                                    style={{
                                        width: "100%",
                                        borderCollapse:
                                            "collapse",
                                    }}
                                >
                                    <thead>
                                        <tr>
                                            <th
                                                style={{
                                                    textAlign:
                                                        "left",
                                                    padding: 8,
                                                }}
                                            >
                                                Handle
                                            </th>

                                            <th
                                                style={{
                                                    textAlign:
                                                        "left",
                                                    padding: 8,
                                                }}
                                            >
                                                Title
                                            </th>

                                            <th
                                                style={{
                                                    textAlign:
                                                        "left",
                                                    padding: 8,
                                                }}
                                            >
                                                Collections
                                            </th>

                                            <th
                                                style={{
                                                    textAlign:
                                                        "left",
                                                    padding: 8,
                                                }}
                                            >
                                                Variants
                                            </th>

                                            <th
                                                style={{
                                                    textAlign:
                                                        "left",
                                                    padding: 8,
                                                }}
                                            >
                                                Images
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {excelProducts
                                            .slice(0, 20)
                                            .map(
                                                (
                                                    item
                                                ) => (
                                                    <tr
                                                        key={
                                                            item.handle
                                                        }
                                                    >
                                                        <td
                                                            style={{
                                                                padding: 8,
                                                            }}
                                                        >
                                                            {
                                                                item.handle
                                                            }
                                                        </td>

                                                        <td
                                                            style={{
                                                                padding: 8,
                                                            }}
                                                        >
                                                            {
                                                                item.title
                                                            }
                                                        </td>

                                                        <td
                                                            style={{
                                                                padding: 8,
                                                            }}
                                                        >
                                                            {item.tags.join(
                                                                ", "
                                                            )}
                                                        </td>

                                                        <td
                                                            style={{
                                                                padding: 8,
                                                            }}
                                                        >
                                                            {
                                                                item
                                                                    .variants
                                                                    .length
                                                            }
                                                        </td>

                                                        <td
                                                            style={{
                                                                padding: 8,
                                                            }}
                                                        >
                                                            {
                                                                item
                                                                    .images
                                                                    .length
                                                            }
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                    </tbody>
                                </table>
                            </div>

                            {excelProducts.length >
                                20 && (
                                    <p
                                        style={{
                                            marginTop: 12,
                                            opacity: 0.7,
                                        }}
                                    >
                                        Showing first 20
                                        products.
                                    </p>
                                )}

                            <div
                                style={{
                                    marginTop: 20,
                                    paddingTop: 20,
                                    borderTop:
                                        "1px solid #e5e5e5",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={
                                            importExcelProducts
                                        }
                                        disabled={
                                            isImportingExcel
                                        }
                                        className="admin-primary-button"
                                    >
                                        {isImportingExcel
                                            ? "Importing Products..."
                                            : `Import ${excelProducts.length} Products`}
                                    </button>

                                    <span
                                        style={{
                                            fontSize: 13,
                                            opacity: 0.7,
                                        }}
                                    >
                                        Existing product
                                        handles will be
                                        skipped.
                                    </span>
                                </div>

                                {excelImportResult && (
                                    <div
                                        style={{
                                            marginTop: 18,
                                            padding: 16,
                                            border:
                                                "1px solid #d8d8d8",
                                            borderRadius: 8,
                                            background:
                                                "#fafafa",
                                        }}
                                    >
                                        <strong>
                                            Import Complete
                                        </strong>

                                        <div
                                            style={{
                                                marginTop: 10,
                                                display: "flex",
                                                gap: 20,
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <span>
                                                Imported:{" "}
                                                <strong>
                                                    {
                                                        excelImportResult
                                                            .importedCount
                                                    }
                                                </strong>
                                            </span>

                                            <span>
                                                Existing products
                                                skipped:{" "}
                                                <strong>
                                                    {
                                                        excelImportResult
                                                            .skippedCount
                                                    }
                                                </strong>
                                            </span>
                                        </div>

                                        {excelImportResult
                                            .skipped.length >
                                            0 && (
                                                <details
                                                    style={{
                                                        marginTop: 12,
                                                    }}
                                                >
                                                    <summary
                                                        style={{
                                                            cursor:
                                                                "pointer",
                                                            fontWeight:
                                                                600,
                                                        }}
                                                    >
                                                        View skipped
                                                        handles
                                                    </summary>

                                                    <div
                                                        style={{
                                                            marginTop: 10,
                                                            maxHeight: 200,
                                                            overflowY:
                                                                "auto",
                                                            fontSize: 13,
                                                            lineHeight:
                                                                1.6,
                                                        }}
                                                    >
                                                        {excelImportResult
                                                            .skipped.map(
                                                                (
                                                                    handle
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            handle
                                                                        }
                                                                    >
                                                                        {
                                                                            handle
                                                                        }
                                                                    </div>
                                                                )
                                                            )}
                                                    </div>
                                                </details>
                                            )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
            </div>

            <div
                className="admin-stat-card"
                style={{
                    marginBottom: 20,
                }}
            >
                <h2>Collections / Tags</h2>

                <p>
                    A product can appear in multiple
                    collections. Collection membership
                    is controlled by tags.
                </p>

                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        marginBottom: 12,
                    }}
                >
                    {product.tags.map((tag) => (
                        <button
                            key={tag}
                            type="button"
                            onClick={() =>
                                removeTag(tag)
                            }
                        >
                            {tag} ×
                        </button>
                    ))}
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: 10,
                        maxWidth: 600,
                    }}
                >
                    <input
                        type="text"
                        value={tagInput}
                        onChange={(event) =>
                            setTagInput(
                                event.target.value
                            )
                        }
                        onKeyDown={(event) => {
                            if (
                                event.key === "Enter"
                            ) {
                                event.preventDefault();
                                addTag();
                            }
                        }}
                        placeholder="Enter collection/tag"
                    />

                    <button
                        type="button"
                        onClick={addTag}
                    >
                        + Add
                    </button>
                </div>

                {product.collection && (
                    <p
                        style={{
                            marginTop: 12,
                            opacity: 0.7,
                        }}
                    >
                        Primary collection / image
                        folder:{" "}
                        <strong>
                            {product.collection}
                        </strong>
                    </p>
                )}
            </div>

            <div
                className="admin-stat-card"
                style={{
                    marginBottom: 20,
                }}
            >
                <h2>Images</h2>

                <p>
                    The first image is the primary
                    product image and will also be used
                    for the catalogue thumbnail.
                </p>

                <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    multiple
                    hidden
                    onChange={selectImages}
                />

                <button
                    type="button"
                    onClick={() =>
                        imageInputRef.current?.click()
                    }
                >
                    + Add Images
                </button>

                {!!previewUrls.length && (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fill, minmax(160px, 1fr))",
                            gap: 16,
                            marginTop: 18,
                        }}
                    >
                        {previewUrls.map(
                            ({ file, url }, index) => (
                                <div
                                    key={`${file.name}-${index}`}
                                    style={{
                                        border:
                                            "1px solid #ddd",
                                        borderRadius: 8,
                                        padding: 10,
                                    }}
                                >
                                    <img
                                        src={url}
                                        alt={file.name}
                                        style={{
                                            width: "100%",
                                            height: 140,
                                            objectFit: "contain",
                                        }}
                                    />

                                    <div
                                        style={{
                                            fontSize: 12,
                                            marginTop: 8,
                                            wordBreak:
                                                "break-word",
                                        }}
                                    >
                                        {file.name}
                                    </div>

                                    {index === 0 ? (
                                        <div
                                            style={{
                                                marginTop: 8,
                                                fontWeight: 600,
                                            }}
                                        >
                                            Primary
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                makePrimaryImage(
                                                    index
                                                )
                                            }
                                            style={{
                                                marginTop: 8,
                                            }}
                                        >
                                            Make Primary
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            removePendingImage(
                                                index
                                            )
                                        }
                                        style={{
                                            marginTop: 8,
                                            marginLeft:
                                                index === 0
                                                    ? 0
                                                    : 8,
                                        }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>

            <div
                className="admin-stat-card"
                style={{
                    marginBottom: 20,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                            "space-between",
                        gap: 12,
                    }}
                >
                    <div>
                        <h2>Variants</h2>

                        <p>
                            Add all replacement,
                            equivalent or brand variants
                            for this product.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={addVariant}
                    >
                        + Add Variant
                    </button>
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        marginBottom: 20,
                    }}
                >
                    {product.variants.map(
                        (item, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() =>
                                    setActiveVariant(index)
                                }
                                style={{
                                    fontWeight:
                                        activeVariant === index
                                            ? 700
                                            : 400,
                                }}
                            >
                                {item.partNumber ||
                                    item.title ||
                                    `Variant ${index + 1}`}
                            </button>
                        )
                    )}
                </div>

                {variant && (
                    <div>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(260px, 1fr))",
                                gap: 16,
                            }}
                        >
                            <label>
                                <strong>
                                    Variant Title *
                                </strong>

                                <input
                                    type="text"
                                    value={variant.title}
                                    onChange={(event) =>
                                        updateVariant(
                                            activeVariant,
                                            "title",
                                            event.target.value
                                        )
                                    }
                                />
                            </label>

                            <label>
                                <strong>
                                    Option1 Value
                                </strong>

                                <input
                                    type="text"
                                    value={
                                        variant.option1Value
                                    }
                                    onChange={(event) =>
                                        updateVariant(
                                            activeVariant,
                                            "option1Value",
                                            event.target.value
                                        )
                                    }
                                />
                            </label>

                            <label>
                                <strong>
                                    Part Number *
                                </strong>

                                <input
                                    type="text"
                                    value={
                                        variant.partNumber
                                    }
                                    onChange={(event) =>
                                        updateVariant(
                                            activeVariant,
                                            "partNumber",
                                            event.target.value
                                        )
                                    }
                                />
                            </label>

                            <label>
                                <strong>
                                    Vendor / Brand
                                </strong>

                                <input
                                    type="text"
                                    value={variant.vendor}
                                    onChange={(event) =>
                                        updateVariant(
                                            activeVariant,
                                            "vendor",
                                            event.target.value
                                        )
                                    }
                                />
                            </label>

                            <label>
                                <strong>Price</strong>

                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={variant.price}
                                    onChange={(event) =>
                                        updateVariant(
                                            activeVariant,
                                            "price",
                                            Number(
                                                event.target.value
                                            ) || 0
                                        )
                                    }
                                />
                            </label>

                            <label>
                                <strong>HS Code</strong>

                                <input
                                    type="text"
                                    value={variant.hsCode}
                                    onChange={(event) =>
                                        updateVariant(
                                            activeVariant,
                                            "hsCode",
                                            event.target.value
                                        )
                                    }
                                />
                            </label>

                            <label>
                                <strong>
                                    Country of Origin
                                </strong>

                                <input
                                    type="text"
                                    value={
                                        variant.countryOfOrigin
                                    }
                                    onChange={(event) =>
                                        updateVariant(
                                            activeVariant,
                                            "countryOfOrigin",
                                            event.target.value
                                        )
                                    }
                                />
                            </label>

                            <label>
                                <strong>
                                    Unit Weight
                                </strong>

                                <input
                                    type="text"
                                    value={
                                        variant.unitWeight
                                    }
                                    onChange={(event) =>
                                        updateVariant(
                                            activeVariant,
                                            "unitWeight",
                                            event.target.value
                                        )
                                    }
                                />
                            </label>

                            <label>
                                <strong>
                                    Shipping Volume
                                </strong>

                                <input
                                    type="text"
                                    value={
                                        variant.shippingVolume
                                    }
                                    onChange={(event) =>
                                        updateVariant(
                                            activeVariant,
                                            "shippingVolume",
                                            event.target.value
                                        )
                                    }
                                />
                            </label>
                        </div>

                        <div
                            style={{
                                marginTop: 16,
                            }}
                        >
                            <label>
                                <strong>Description</strong>

                                <textarea
                                    value={
                                        variant.description
                                    }
                                    onChange={(event) =>
                                        updateVariant(
                                            activeVariant,
                                            "description",
                                            event.target.value
                                        )
                                    }
                                    rows={5}
                                />
                            </label>
                        </div>

                        <div
                            style={{
                                marginTop: 16,
                            }}
                        >
                            <label>
                                <strong>
                                    Specifications
                                </strong>

                                <textarea
                                    value={
                                        variant.specifications.join(
                                            "\n"
                                        )
                                    }
                                    onChange={(event) =>
                                        updateVariant(
                                            activeVariant,
                                            "specifications",
                                            event.target.value
                                                .split("\n")
                                                .map((item) =>
                                                    item.trim()
                                                )
                                                .filter(Boolean)
                                        )
                                    }
                                    rows={6}
                                    placeholder={
                                        "Enter one specification per line"
                                    }
                                />
                            </label>
                        </div>

                        <div
                            style={{
                                marginTop: 16,
                            }}
                        >
                            <strong>
                                Variant Image
                            </strong>

                            <p>
                                Select one of the product
                                images for this variant.
                            </p>

                            {!previewUrls.length ? (
                                <p>
                                    Add product images above
                                    first.
                                </p>
                            ) : (
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 12,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    {previewUrls.map(
                                        (
                                            { file, url },
                                            index
                                        ) => (
                                            <button
                                                key={`${file.name}-${index}`}
                                                type="button"
                                                onClick={() =>
                                                    updateVariant(
                                                        activeVariant,
                                                        "image",
                                                        file.name
                                                    )
                                                }
                                                style={{
                                                    padding: 6,
                                                    border:
                                                        variant.image ===
                                                            file.name
                                                            ? "2px solid #173f4c"
                                                            : "1px solid #ddd",
                                                }}
                                            >
                                                <img
                                                    src={url}
                                                    alt={file.name}
                                                    style={{
                                                        width: 80,
                                                        height: 80,
                                                        objectFit:
                                                            "contain",
                                                    }}
                                                />
                                            </button>
                                        )
                                    )}
                                </div>
                            )}

                            {variant.image && (
                                <p>
                                    Selected:{" "}
                                    <strong>
                                        {variant.image}
                                    </strong>{" "}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            updateVariant(
                                                activeVariant,
                                                "image",
                                                ""
                                            )
                                        }
                                    >
                                        Remove
                                    </button>
                                </p>
                            )}
                        </div>

                        <div
                            style={{
                                marginTop: 24,
                            }}
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    removeVariant(
                                        activeVariant
                                    )
                                }
                                disabled={
                                    product.variants.length <=
                                    1
                                }
                            >
                                Remove Variant
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    paddingBottom: 40,
                }}
            >
                <button
                    type="button"
                    onClick={createProduct}
                    disabled={isCreating}
                >
                    {isCreating
                        ? "Creating Product..."
                        : "Create Product"}
                </button>
            </div>
        </main>
    );
}