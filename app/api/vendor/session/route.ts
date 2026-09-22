import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";

    const vendorCookie = cookieHeader
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith("sparesco_vendor="));

    if (!vendorCookie) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor login required.",
        },
        { status: 401 }
      );
    }

    const cookieValue = decodeURIComponent(
      vendorCookie.split("=")[1] || ""
    );

    const [vendorIdRaw, sessionToken] = cookieValue.split(":");

    const vendorId = Number(vendorIdRaw);

    if (!vendorId || !sessionToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid vendor session.",
        },
        { status: 401 }
      );
    }

    const { env } = getRequestContext();
    const db = (env as any).DB;

    if (!db) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor database is not configured.",
        },
        { status: 500 }
      );
    }

    const session = await db
      .prepare(
        `
        SELECT
          vs.id,
          vs.vendor_id,
          vs.expires_at,
          v.company_name,
          v.contact_person,
          v.email,
          v.phone,
          v.gst_number,
          v.address,
          v.city,
          v.state,
          v.country,
          v.website,
          v.status,
          v.product_limit,
          v.products_submitted
        FROM vendor_sessions vs
        JOIN vendors v
          ON v.id = vs.vendor_id
        WHERE vs.vendor_id = ?
          AND vs.session_token = ?
        LIMIT 1
        `
      )
      .bind(vendorId, sessionToken)
      .first();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor session not found.",
        },
        { status: 401 }
      );
    }

    if (session.status !== "approved") {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor account is not approved.",
        },
        { status: 403 }
      );
    }

    const expiresAt = new Date(session.expires_at).getTime();

    if (Date.now() > expiresAt) {
      await db
        .prepare(
          `
          DELETE FROM vendor_sessions
          WHERE id = ?
          `
        )
        .bind(session.id)
        .run();

      return NextResponse.json(
        {
          success: false,
          error: "Vendor session has expired.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      vendor: {
        id: session.vendor_id,
        company_name: session.company_name,
        contact_person: session.contact_person,
        email: session.email,
        phone: session.phone,
        gst_number: session.gst_number,
        address: session.address,
        city: session.city,
        state: session.state,
        country: session.country,
        website: session.website,
        status: session.status,
        product_limit: session.product_limit,
        products_submitted: session.products_submitted,
      },
    });
  } catch (error) {
    console.error("Vendor session error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to verify vendor session.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";

    const vendorCookie = cookieHeader
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith("sparesco_vendor="));

    if (!vendorCookie) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor login required.",
        },
        { status: 401 }
      );
    }

    const cookieValue = decodeURIComponent(
      vendorCookie.split("=")[1] || ""
    );

    const [vendorIdRaw, sessionToken] = cookieValue.split(":");
    const vendorId = Number(vendorIdRaw);

    if (!vendorId || !sessionToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid vendor session.",
        },
        { status: 401 }
      );
    }

    const { env } = getRequestContext();
    const db = (env as any).DB;

    if (!db) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor database is not configured.",
        },
        { status: 500 }
      );
    }

    const session = await db
      .prepare(
        `
        SELECT
          vs.id,
          vs.vendor_id,
          vs.expires_at,
          v.status
        FROM vendor_sessions vs
        JOIN vendors v
          ON v.id = vs.vendor_id
        WHERE vs.vendor_id = ?
          AND vs.session_token = ?
        LIMIT 1
        `
      )
      .bind(vendorId, sessionToken)
      .first();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor session not found.",
        },
        { status: 401 }
      );
    }

    const expiresAt = new Date(session.expires_at).getTime();

    if (Date.now() > expiresAt) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor session has expired.",
        },
        { status: 401 }
      );
    }

    if (session.status !== "approved") {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor account is not approved.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const contactPerson = String(
      body.contact_person || ""
    ).trim();

    const phone = String(body.phone || "").trim();
    const address = String(body.address || "").trim();
    const city = String(body.city || "").trim();
    const state = String(body.state || "").trim();
    const country = String(body.country || "").trim();
    const website = String(body.website || "").trim();

    if (!contactPerson) {
      return NextResponse.json(
        {
          success: false,
          error: "Contact person is required.",
        },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          error: "Contact number is required.",
        },
        { status: 400 }
      );
    }

    if (website) {
      try {
        const url = new URL(website);

        if (
          url.protocol !== "http:" &&
          url.protocol !== "https:"
        ) {
          throw new Error("Invalid protocol");
        }
      } catch {
        return NextResponse.json(
          {
            success: false,
            error:
              "Website must be a valid URL beginning with http:// or https://.",
          },
          { status: 400 }
        );
      }
    }

    await db
      .prepare(
        `
        UPDATE vendors
        SET
          contact_person = ?,
          phone = ?,
          address = ?,
          city = ?,
          state = ?,
          country = ?,
          website = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `
      )
      .bind(
        contactPerson,
        phone,
        address || null,
        city || null,
        state || null,
        country || null,
        website || null,
        session.vendor_id
      )
      .run();

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      vendor: {
        contact_person: contactPerson,
        phone,
        address: address || null,
        city: city || null,
        state: state || null,
        country: country || null,
        website: website || null,
      },
    });
  } catch (error) {
    console.error("Vendor profile update error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to update vendor profile.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";

    const vendorCookie = cookieHeader
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith("sparesco_vendor="));

    if (vendorCookie) {
      const cookieValue = decodeURIComponent(
        vendorCookie.split("=")[1] || ""
      );

      const [vendorIdRaw, sessionToken] = cookieValue.split(":");
      const vendorId = Number(vendorIdRaw);

      if (vendorId && sessionToken) {
        const { env } = getRequestContext();
        const db = (env as any).DB;

        if (db) {
          await db
            .prepare(
              `
              DELETE FROM vendor_sessions
              WHERE vendor_id = ?
                AND session_token = ?
              `
            )
            .bind(vendorId, sessionToken)
            .run();
        }
      }
    }

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully.",
    });

    response.cookies.set("sparesco_vendor", "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Vendor logout error:", error);

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully.",
    });

    response.cookies.set("sparesco_vendor", "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  }
}