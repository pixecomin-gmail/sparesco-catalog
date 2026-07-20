import { NextRequest, NextResponse } from "next/server";

export const runtime = "experimental-edge";

const ACCESS_COOKIE = "sparesco_access";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Password protection is disabled unless SITE_LOCKED=true
  if (process.env.SITE_LOCKED !== "true") {
    return NextResponse.next();
  }

  // Allow the password page and its API route
  if (
    pathname === "/password" ||
    pathname.startsWith("/api/password")
  ) {
    return NextResponse.next();
  }

  // Allow Next.js assets and public files to load normally
  if (
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const accessCookie = request.cookies.get(ACCESS_COOKIE)?.value;

  if (
    accessCookie &&
    accessCookie === process.env.SITE_ACCESS_TOKEN
  ) {
    return NextResponse.next();
  }

  const passwordUrl = new URL("/password", request.url);

  return NextResponse.redirect(passwordUrl);
}

export const config = {
  matcher: "/:path*",
};