import { NextRequest, NextResponse } from "next/server";

const ACCESS_COOKIE = "sparesco_access";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (process.env.SITE_LOCKED !== "true") {
    return NextResponse.next();
  }

  if (
    pathname === "/password" ||
    pathname.startsWith("/api/password")
  ) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const accessCookie =
    request.cookies.get(ACCESS_COOKIE)?.value;

  if (
    accessCookie &&
    accessCookie === process.env.SITE_ACCESS_TOKEN
  ) {
    return NextResponse.next();
  }

  return NextResponse.redirect(
    new URL("/password", request.url)
  );
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};