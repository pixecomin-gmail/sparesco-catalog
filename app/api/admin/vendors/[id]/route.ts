import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const vendorId = Number(id);

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: "Invalid vendor ID." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, action } = body;

    if (
      action !== "increase_limit" &&
      !["approved", "rejected"].includes(status)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid request." },
        { status: 400 }
      );
    }

    const { env } = getRequestContext();
    const db = (env as any).DB;

    if (!db) {
      return NextResponse.json(
        { success: false, error: "Vendor database is not configured." },
        { status: 500 }
      );
    }

    if (action === "increase_limit") {
      await db
        .prepare(
          `
      UPDATE vendors
      SET
        product_limit = product_limit + 10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `
        )
        .bind(vendorId)
        .run();

      const vendor = await db
        .prepare(
          `
      SELECT product_limit
      FROM vendors
      WHERE id = ?
      `
        )
        .bind(vendorId)
        .first();

      return NextResponse.json({
        success: true,
        product_limit: vendor?.product_limit,
        message: "Product limit increased by 10.",
      });
    }

    await db
      .prepare(
        `
    UPDATE vendors
    SET
      status = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    `
      )
      .bind(status, vendorId)
      .run();

    return NextResponse.json({
      success: true,
      message: `Vendor ${status} successfully.`,
    });
  } catch (error) {
    console.error("Vendor status update error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to update vendor status." },
      { status: 500 }
    );
  }
}