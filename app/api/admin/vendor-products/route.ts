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
};

function compact(value?: string | null) {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
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
     * Collect search shards for BOTH vendor identifiers:
     *
     * - product_name
     * - part_number
     *
     * Example:
     * product_name = P761490
     * part_number  = HFL92001
     *
     * We therefore inspect both "p7" and "hf".
     */
    const shardNames = new Set<string>();

    for (const product of products) {
      const identifiers = [
        compact(product.product_name),
        compact(product.part_number),
      ];

      for (const identifier of identifiers) {
        if (identifier.length >= 2) {
          shardNames.add(identifier.slice(0, 2));
        }
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

    const productsWithSiteStatus = products.map((product) => {
      const vendorIdentifiers = new Set(
        [
          compact(product.product_name),
          compact(product.part_number),
        ].filter(Boolean)
      );

      if (vendorIdentifiers.size === 0) {
        return {
          ...product,
          is_on_site: false,
        };
      }

      const relevantShards = new Set<string>();

      for (const identifier of vendorIdentifiers) {
        if (identifier.length >= 2) {
          relevantShards.add(identifier.slice(0, 2));
        }
      }

      let lookupFailed = false;
      let found = false;

      for (const shard of relevantShards) {
        const items = shardItems.get(shard);

        if (items === null || items === undefined) {
          lookupFailed = true;
          continue;
        }

        for (const item of items) {
          const websiteIdentifiers = [
            compact(item.p),
            compact(item.t),
            compact(item.h),
          ];

          const matches = websiteIdentifiers.some(
            (websiteIdentifier) =>
              websiteIdentifier &&
              vendorIdentifiers.has(websiteIdentifier)
          );

          if (matches) {
            found = true;
            break;
          }
        }

        if (found) {
          break;
        }
      }

      /*
       * If we found an exact identifier match, it is on site.
       *
       * If we couldn't complete the R2 lookup, return null so
       * the UI doesn't falsely label the product NOT ON SITE.
       *
       * Otherwise it genuinely wasn't found.
       */
      return {
        ...product,
        is_on_site: found
          ? true
          : lookupFailed
            ? null
            : false,
      };
    });

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