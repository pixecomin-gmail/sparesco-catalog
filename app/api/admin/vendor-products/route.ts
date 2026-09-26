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
     * If R2 is unavailable, don't incorrectly label every product
     * as NOT ON SITE.
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
     * Group the vendor products by the same 2-character shard
     * used by catalog/search-v2.
     */
    const shardNames = new Set<string>();

    for (const product of products) {
      const normalizedPartNumber = compact(product.part_number);

      if (normalizedPartNumber.length >= 2) {
        shardNames.add(normalizedPartNumber.slice(0, 2));
      }
    }

    /*
     * Load each unique R2 shard only once.
     */
    const shardPartNumbers = new Map<string, Set<string>>();

    await Promise.all(
      Array.from(shardNames).map(async (shard) => {
        try {
          const response = await fetch(
            `${base}/catalog/search-v2/${shard}.json`,
            {
              cache: "no-store",
            }
          );

          if (!response.ok) {
            shardPartNumbers.set(shard, new Set());
            return;
          }

          const items = (await response.json()) as SearchItem[];

          const partNumbers = new Set(
            items
              .map((item) => compact(item.p))
              .filter(Boolean)
          );

          shardPartNumbers.set(shard, partNumbers);
        } catch {
          /*
           * Don't mark products as NOT ON SITE when the R2
           * lookup itself failed.
           */
          shardPartNumbers.set(shard, new Set());
        }
      })
    );

    const productsWithSiteStatus = products.map((product) => {
      const normalizedPartNumber = compact(product.part_number);

      if (normalizedPartNumber.length < 2) {
        return {
          ...product,
          is_on_site: false,
        };
      }

      const shard = normalizedPartNumber.slice(0, 2);
      const partNumbers = shardPartNumbers.get(shard);

      return {
        ...product,
        is_on_site: partNumbers
          ? partNumbers.has(normalizedPartNumber)
          : null,
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