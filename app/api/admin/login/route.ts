// import { NextResponse } from "next/server";
// import { sendAdminOtpEmail } from "@/lib/send-admin-email";

// export const runtime = "edge";

// async function createOtpHash(
//   otp: string,
//   sessionSecret: string
// ) {
//   const value = `${otp}:${sessionSecret}`;

//   const data = new TextEncoder().encode(value);

//   const hash = await crypto.subtle.digest(
//     "SHA-256",
//     data
//   );

//   return Array.from(new Uint8Array(hash))
//     .map((byte) =>
//       byte.toString(16).padStart(2, "0")
//     )
//     .join("");
// }

// export async function POST(request: Request) {
//   try {
//     const body = await request.json();

//     const password = String(body.password || "");
//     const securityCode = String(
//       body.securityCode || ""
//     );

//     const adminPassword =
//       process.env.ADMIN_PASSWORD;

//     const adminSecurityCode =
//       process.env.ADMIN_SECURITY_CODE;

//     const adminEmail =
//       process.env.ADMIN_EMAIL;

//     const adminSessionToken =
//       process.env.ADMIN_SESSION_TOKEN;

//     if (
//       !adminPassword ||
//       !adminSecurityCode ||
//       !adminEmail ||
//       !adminSessionToken
//     ) {
//       return NextResponse.json(
//         {
//           success: false,
//           error:
//             "Admin authentication is not configured.",
//         },
//         { status: 500 }
//       );
//     }

//     if (
//       password !== adminPassword ||
//       securityCode !== adminSecurityCode
//     ) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: "Invalid admin credentials.",
//         },
//         { status: 401 }
//       );
//     }

//     const random = new Uint32Array(1);
//     crypto.getRandomValues(random);

//     const otp = String(
//       100000 + (random[0] % 900000)
//     );

//     const otpHash = await createOtpHash(
//       otp,
//       adminSessionToken
//     );

//     await sendAdminOtpEmail({
//       to: adminEmail,
//       otp,
//     });

//     const response = NextResponse.json({
//       success: true,
//       message:
//         "OTP sent to the administrator email.",
//     });

//     response.cookies.set(
//       "sparesco_admin_otp",
//       otpHash,
//       {
//         httpOnly: true,
//         secure: true,
//         sameSite: "strict",
//         path: "/",
//         maxAge: 60 * 10,
//       }
//     );

//     return response;
//   } catch (error) {
//     console.error(
//       "Admin OTP request error:",
//       error
//     );

//     return NextResponse.json(
//       {
//         success: false,
//         error: "Unable to request OTP.",
//       },
//       { status: 500 }
//     );
//   }
// }

// New file starts here
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const password = String(body.password || "");

    const adminPassword =
      process.env.ADMIN_PASSWORD;

    const adminSessionToken =
      process.env.ADMIN_SESSION_TOKEN;

    if (!adminPassword || !adminSessionToken) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Admin authentication is not configured.",
        },
        { status: 500 }
      );
    }

    if (password !== adminPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid admin password.",
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set(
      "sparesco_admin",
      adminSessionToken,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24,
      }
    );

    return response;
  } catch (error) {
    console.error(
      "Admin login error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to login.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
  });

  response.cookies.set(
    "sparesco_admin",
    "",
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    }
  );

  return response;
}