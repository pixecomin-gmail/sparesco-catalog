"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { productJsonUrl } from "@/lib/r2";
import { getCatalogImageUrls, type ProductIndexItem } from "@/lib/products";

export type EnquiryItem = {
  id: string;
  handle: string;
  title: string;
  image: string;
  partNumber: string;
  vendor: string;
  price: number;
  quantity: number;
};

type EnquiryContextType = {
  items: EnquiryItem[];
  hasLoaded: boolean;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (
    item: Omit<EnquiryItem, "quantity">
  ) => void;
  removeItem: (id: string) => void;
  increaseQty: (id: string) => void;
  decreaseQty: (id: string) => void;
};

const STORAGE_KEY =
  "sparesco_enquiry_items";

const EnquiryContext =
  createContext<EnquiryContextType | null>(
    null
  );

function clean(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

async function refreshEnquiryItem(
  item: EnquiryItem
): Promise<EnquiryItem> {
  try {
    if (!item.handle) {
      return item;
    }

    const response = await fetch(
      `${productJsonUrl(item.handle)}?v=${Date.now()}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return item;
    }

    const product =
      await response.json();

    const variants =
      Array.isArray(product.variants)
        ? product.variants
        : [];

    const firstVariant = variants[0] || {};

    const imageProduct = {
      handle: product.handle,
      title: product.title,
      category: product.category || "",
      collection: product.collection || "",
      collectionHandle:
        product.collectionHandle || product.collection || "",
      image: product.images?.[0] || product.image || "",
      imageFolder: product.imageFolder || product.collection || "",
      partNumber:
        firstVariant.partNumber || product.title || "",
      vendor:
        firstVariant.vendor || product.collection || "",
      variantCount: variants.length || 1,
      price: Number(firstVariant.price || 0),
    } as ProductIndexItem;

    const {
      thumbnail: currentThumbnail,
      original: currentOriginal,
    } = getCatalogImageUrls(imageProduct);

    const currentImage =
      currentThumbnail ||
      currentOriginal ||
      item.image ||
      "/images/product-placeholder.webp";

    /*
     * Keep the exact variant the customer selected.
     *
     * The enquiry item already contains its
     * part number, so use that to find the
     * latest version of the same variant.
     */
    const selectedVariant =
      variants.find(
        (variant: any) =>
          clean(variant?.partNumber) ===
          clean(item.partNumber)
      ) ||
      /*
       * Some older enquiry items may have been
       * stored before a proper part number existed.
       */
      variants.find(
        (variant: any) =>
          clean(variant?.title) ===
          clean(item.partNumber)
      ) ||
      /*
       * Only fall back to the first variant when
       * this is effectively a single-variant product.
       */
      (variants.length === 1
        ? variants[0]
        : null);

    /*
     * For a multi-variant product, if we cannot
     * confidently identify the selected variant,
     * preserve the customer's existing snapshot.
     */
    if (
      variants.length > 1 &&
      !selectedVariant
    ) {
      return {
        ...item,
        title:
          product.title ||
          item.title,
        image: currentImage,
      };
    }

    const variant =
      selectedVariant ||
      variants[0] ||
      {};

    return {
      ...item,

      /*
       * Preserve identity and customer quantity.
       */
      id: item.id,
      handle: item.handle,
      quantity: item.quantity,

      /*
       * Refresh catalogue-controlled data.
       */
      title:
        product.title ||
        item.title,

      image: currentImage,

      partNumber:
        variant.partNumber ||
        item.partNumber,

      vendor:
        variant.vendor ||
        product.vendor ||
        product.collection ||
        item.vendor,

      price:
        Number(
          variant.price ??
          product.price ??
          item.price ??
          0
        ),
    };
  } catch {
    /*
     * Never destroy an enquiry because a product
     * refresh temporarily failed.
     */
    return item;
  }
}

export function EnquiryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] =
    useState<EnquiryItem[]>([]);

  const [hasLoaded, setHasLoaded] =
    useState(false);

  const [
    isDrawerOpen,
    setIsDrawerOpen,
  ] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      let savedItems: EnquiryItem[] = [];

      try {
        const stored =
          localStorage.getItem(
            STORAGE_KEY
          );

        if (stored) {
          const parsed =
            JSON.parse(stored);

          if (Array.isArray(parsed)) {
            savedItems = parsed;
          }
        }
      } catch {
        savedItems = [];
      }

      if (!savedItems.length) {
        if (!cancelled) {
          setItems([]);
          setHasLoaded(true);
        }

        return;
      }

      /*
       * Refresh all saved enquiry products from
       * the current catalogue in parallel.
       */
      const refreshedItems =
        await Promise.all(
          savedItems.map(
            refreshEnquiryItem
          )
        );

      if (cancelled) {
        return;
      }

      setItems(refreshedItems);
      setHasLoaded(true);
    }

    loadItems();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items)
    );
  }, [items, hasLoaded]);

  function openDrawer() {
    setIsDrawerOpen(true);
  }

  function closeDrawer() {
    setIsDrawerOpen(false);
  }

  function addItem(
    item: Omit<
      EnquiryItem,
      "quantity"
    >
  ) {
    setItems(
      (currentItems) => {
        const existingItem =
          currentItems.find(
            (currentItem) =>
              currentItem.id ===
              item.id
          );

        if (existingItem) {
          return [
            {
              /*
               * Also refresh the snapshot when
               * the customer adds the product again.
               */
              ...existingItem,
              ...item,

              quantity:
                existingItem.quantity +
                1,
            },

            ...currentItems.filter(
              (currentItem) =>
                currentItem.id !==
                item.id
            ),
          ];
        }

        return [
          {
            ...item,
            quantity: 1,
          },

          ...currentItems,
        ];
      }
    );

    openDrawer();
  }

  function removeItem(id: string) {
    setItems(
      (currentItems) =>
        currentItems.filter(
          (item) =>
            item.id !== id
        )
    );
  }

  function increaseQty(id: string) {
    setItems(
      (currentItems) =>
        currentItems.map(
          (item) =>
            item.id === id
              ? {
                ...item,
                quantity:
                  item.quantity +
                  1,
              }
              : item
        )
    );
  }

  function decreaseQty(id: string) {
    setItems(
      (currentItems) =>
        currentItems.map(
          (item) =>
            item.id === id
              ? {
                ...item,

                quantity:
                  Math.max(
                    1,
                    item.quantity -
                    1
                  ),
              }
              : item
        )
    );
  }

  return (
    <EnquiryContext.Provider
      value={{
        items,
        hasLoaded,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        addItem,
        removeItem,
        increaseQty,
        decreaseQty,
      }}
    >
      {children}
    </EnquiryContext.Provider>
  );
}

export function useEnquiry() {
  const context =
    useContext(EnquiryContext);

  if (!context) {
    throw new Error(
      "useEnquiry must be used inside EnquiryProvider"
    );
  }

  return context;
}