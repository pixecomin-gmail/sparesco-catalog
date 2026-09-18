import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const enquiryId = Number(id);

    if (!enquiryId) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid enquiry ID.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const status = body.status;

    if (!["open", "closed"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid enquiry status.",
        },
        { status: 400 }
      );
    }

    const { env } = getRequestContext();
    const DB = (env as any).DB;

    if (!DB) {
      return NextResponse.json(
        {
          success: false,
          error: "Database binding not found.",
        },
        { status: 500 }
      );
    }

    const enquiry = await DB.prepare(`
      SELECT id
      FROM enquiries
      WHERE id = ?
      LIMIT 1
    `)
      .bind(enquiryId)
      .first();

    if (!enquiry) {
      return NextResponse.json(
        {
          success: false,
          error: "Enquiry not found.",
        },
        { status: 404 }
      );
    }

    await DB.prepare(`
      UPDATE enquiries
      SET status = ?
      WHERE id = ?
    `)
      .bind(status, enquiryId)
      .run();

    return NextResponse.json({
      success: true,
      status,
      message:
        status === "closed"
          ? "Enquiry closed successfully."
          : "Enquiry reopened successfully.",
    });
  } catch (error) {
    console.error("Admin enquiry update error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to update enquiry.",
      },
      { status: 500 }
    );
  }
}