import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = body.password;

    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json(
        { success: false, error: "Admin password is not configured." },
        { status: 500 }
      );
    }

    if (password !== adminPassword) {
      return NextResponse.json(
        { success: false, error: "Incorrect password." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set(
    "sparesco_admin",
    process.env.ADMIN_SESSION_TOKEN || "",
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
    console.error("Admin login error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to login." },
      { status: 500 }
    );
  }
}