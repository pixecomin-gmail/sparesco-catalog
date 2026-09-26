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
      v.status,
      v.contact_person,
      v.phone,
      v.address,
      v.city,
      v.state,
      v.country,
      v.website
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

    const clean = (value: unknown) =>
      String(value ?? "").trim();

    const existingContactPerson = clean(session.contact_person);
    const existingPhone = clean(session.phone);
    const existingAddress = clean(session.address);
    const existingCity = clean(session.city);
    const existingState = clean(session.state);
    const existingCountry = clean(session.country);
    const existingWebsite = clean(session.website);

    const submittedAddress = clean(body.address);
    const submittedCity = clean(body.city);
    const submittedState = clean(body.state);
    const submittedCountry = clean(body.country);
    const submittedWebsite = clean(body.website);

    /*
      Write-once profile rule:
      - Contact person and phone were supplied at registration,
        so they cannot be changed by the vendor.
      - Optional fields may be added only while currently blank.
      - Once an optional field has a value, it becomes read-only.
    */

    const address =
      existingAddress || submittedAddress;

    const city =
      existingCity || submittedCity;

    const state =
      existingState || submittedState;

    const country =
      existingCountry || submittedCountry;

    const website =
      existingWebsite || submittedWebsite;

    if (!existingContactPerson) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor contact person is missing.",
        },
        { status: 400 }
      );
    }

    if (!existingPhone) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor contact number is missing.",
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
        contact_person: existingContactPerson,
        phone: existingPhone,
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