import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

type VendorProductRow = {
  id: number;
  vendor_id: number;
  product_name: string;
  part_number: string | null;
  brand: string | null;
  category: string | null;
  description: string | null;
  price: string | null;
  currency: string | null;
  stock_quantity: number | null;
  application: string | null;
  godown_location: string | null;
  lead_time: string | null;
  status: string;
  admin_notes: string | null;
  delete_requested: number;
  created_at: string;
  company_name: string;
  contact_person: string;
  email: string;
};

type SearchItem = {
  h?: string;
  t?: string;
  p?: string;
  x?: string;
};

function compact(value?: string | null) {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

type CatalogProduct = {
  variants?: Array<{
    partNumber?: string | null;
  }>;
};

function productFolder(handle: string) {
  let hash = 0;

  for (let i = 0; i < handle.length; i++) {
    hash = (hash * 31 + handle.charCodeAt(i)) >>> 0;
  }

  return (hash % 256).toString(16).padStart(2, "0");
}

async function fetchCatalogProduct(
  base: string,
  handle: string
): Promise<CatalogProduct | null> {
  const folder = productFolder(handle);

  const urls = [
    `${base}/catalog/products/${folder}/${handle}.json`,
    `${base}/catalog/products/${handle}.json`,
  ];

  for (const url of urls) {
    const response = await fetch(url, {
      cache: "no-store",
    });

    if (response.status === 404) {
      continue;
    }

    if (!response.ok) {
      throw new Error(
        `Catalogue lookup failed for ${handle}: ${response.status}`
      );
    }

    const data = (await response.json()) as CatalogProduct;

    if (!Array.isArray(data.variants)) {
      throw new Error(
        `Invalid catalogue variants for ${handle}`
      );
    }

    return data;
  }

  return null;
}

export async function GET() {
  try {
    const { env } = getRequestContext();
    const db = (env as any).DB;

    if (!db) {
      return NextResponse.json(
        {
          success: false,
          error: "Database is not configured.",
        },
        { status: 500 }
      );
    }

    const result = await db
      .prepare(
        `
        SELECT
          vp.id,
          vp.vendor_id,
          vp.product_name,
          vp.part_number,
          vp.brand,
          vp.category,
          vp.description,
          vp.price,
          vp.currency,
          vp.stock_quantity,
          vp.application,
          vp.godown_location,
          vp.lead_time,
          vp.status,
          vp.admin_notes,
          vp.delete_requested,
          vp.created_at,
          v.company_name,
          v.contact_person,
          v.email
        FROM vendor_products vp
        JOIN vendors v
          ON v.id = vp.vendor_id
        ORDER BY vp.id DESC
        `
      )
      .all();

    const products = (result.results || []) as VendorProductRow[];

    const r2Base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

    /*
     * If R2 is unavailable, don't incorrectly show NOT ON SITE.
     */
    if (!r2Base) {
      return NextResponse.json({
        success: true,
        products: products.map((product) => ({
          ...product,
          is_on_site: null,
        })),
      });
    }

    const base = r2Base.replace(/\/$/, "");

    /*
 * Use only the vendor's part number.
 * Search shards identify candidate catalogue products.
 */
    const shardNames = new Set<string>();

    for (const product of products) {
      const partNumber = compact(product.part_number);

      if (partNumber.length >= 2) {
        shardNames.add(partNumber.slice(0, 2));
      }
    }

    /*
     * Load every required shard only once.
     *
     * null means the shard could not be checked.
     * This prevents a failed R2 request from being interpreted
     * as "NOT ON SITE".
     */
    const shardItems = new Map<string, SearchItem[] | null>();

    await Promise.all(
      Array.from(shardNames).map(async (shard) => {
        try {
          const response = await fetch(
            `${base}/catalog/search-v2/${shard}.json`,
            {
              cache: "no-store",
            }
          );

          if (response.status === 404) {
            shardItems.set(shard, []);
            return;
          }

          if (!response.ok) {
            shardItems.set(shard, null);
            return;
          }

          const items = (await response.json()) as SearchItem[];

          shardItems.set(shard, items);
        } catch {
          shardItems.set(shard, null);
        }
      })
    );


    const catalogCache = new Map<
      string,
      Promise<CatalogProduct | null>
    >();

    function getCatalogProduct(handle: string) {
      const existing = catalogCache.get(handle);

      if (existing) {
        return existing;
      }

      const request = fetchCatalogProduct(base, handle);

      catalogCache.set(handle, request);

      return request;
    }

    const productsWithSiteStatus = await Promise.all(
      products.map(async (product) => {
        const partNumber = compact(product.part_number);

        if (!partNumber) {
          return {
            ...product,
            is_on_site: false,
          };
        }

        if (partNumber.length < 2) {
          return {
            ...product,
            is_on_site: null,
          };
        }

        const items = shardItems.get(
          partNumber.slice(0, 2)
        );

        if (!Array.isArray(items)) {
          return {
            ...product,
            is_on_site: null,
          };
        }

        const candidates = items.filter((item) => {
          const searchTerms = (item.x || "")
            .split(/\s+/);

          return (
            compact(item.p) === partNumber ||
            searchTerms.includes(partNumber)
          );
        });

        let lookupFailed = false;

        for (const candidate of candidates) {
          const handle = candidate.h;

          if (!handle) {
            lookupFailed = true;
            continue;
          }

          try {
            const catalogProduct =
              await getCatalogProduct(handle);

            if (!catalogProduct) {
              lookupFailed = true;
              continue;
            }

            const matches = catalogProduct.variants!.some(
              (variant) =>
                compact(variant.partNumber) === partNumber
            );

            if (matches) {
              return {
                ...product,
                is_on_site: true,
              };
            }
          } catch (error) {
            console.error(
              "Vendor catalogue verification failed:",
              handle,
              error
            );

            lookupFailed = true;
          }
        }

              return {
          ...product,
          is_on_site: lookupFailed ? null : false,
        };
      })
    );

    return NextResponse.json({
      success: true,
      products: productsWithSiteStatus,
    });
  } catch (error) {
    console.error("Admin vendor products error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load vendor products.",
      },
      { status: 500 }
    );
  }
}