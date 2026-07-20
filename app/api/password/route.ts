import { NextResponse } from "next/server";

export const runtime = "edge";

const ACCESS_COOKIE = "sparesco_access";

export async function POST(request: Request) {
  const { password } = await request.json();

  if (
    !process.env.SITE_PASSWORD ||
    !process.env.SITE_ACCESS_TOKEN
  ) {
    return NextResponse.json(
      { error: "Password protection is not configured." },
      { status: 500 }
    );
  }

  if (password !== process.env.SITE_PASSWORD) {
    return NextResponse.json(
      { error: "Incorrect password." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set(ACCESS_COOKIE, process.env.SITE_ACCESS_TOKEN, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}