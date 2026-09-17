import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const productId = Number(id);

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid product ID.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const status = body.status;

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid product status.",
        },
        { status: 400 }
      );
    }

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

    const product = await db
      .prepare(
        `
        SELECT
          id,
          vendor_id,
          product_name,
          status
        FROM vendor_products
        WHERE id = ?
        LIMIT 1
        `
      )
      .bind(productId)
      .first();

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor product not found.",
        },
        { status: 404 }
      );
    }

    await db
      .prepare(
        `
        UPDATE vendor_products
        SET
          status = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `
      )
      .bind(status, productId)
      .run();

    return NextResponse.json({
      success: true,
      message:
        status === "approved"
          ? "Product approved successfully."
          : "Product rejected successfully.",
    });
  } catch (error) {
    console.error("Admin vendor product update error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to update vendor product.",
      },
      { status: 500 }
    );
  }
}