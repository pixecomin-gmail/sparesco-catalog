import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "edge";

async function createOtpHash(
  otp: string,
  sessionSecret: string
) {
  const value = `${otp}:${sessionSecret}`;

  const data = new TextEncoder().encode(value);

  const hash = await crypto.subtle.digest(
    "SHA-256",
    data
  );

  return Array.from(new Uint8Array(hash))
    .map((byte) =>
      byte.toString(16).padStart(2, "0")
    )
    .join("");
}

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const otp = String(body.otp || "").trim();

    const adminSessionToken =
      process.env.ADMIN_SESSION_TOKEN;

    if (!adminSessionToken) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Admin authentication is not configured.",
        },
        { status: 500 }
      );
    }

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired OTP.",
        },
        { status: 401 }
      );
    }

    const storedOtpHash =
      request.cookies.get(
        "sparesco_admin_otp"
      )?.value;

    if (!storedOtpHash) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired OTP.",
        },
        { status: 401 }
      );
    }

    const enteredOtpHash =
      await createOtpHash(
        otp,
        adminSessionToken
      );

    if (enteredOtpHash !== storedOtpHash) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired OTP.",
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
    });

    // Remove OTP challenge.
    response.cookies.set(
      "sparesco_admin_otp",
      "",
      {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
        maxAge: 0,
      }
    );

    // Create authenticated admin session.
    response.cookies.set(
      "sparesco_admin",
      adminSessionToken,
      {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 30,
      }
    );

    return response;
  } catch (error) {
    console.error(
      "Admin OTP verification error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to verify OTP.",
      },
      { status: 500 }
    );
  }
}