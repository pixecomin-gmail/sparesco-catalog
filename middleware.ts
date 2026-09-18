import { NextRequest, NextResponse } from "next/server";

const ACCESS_COOKIE = "sparesco_access";
const ADMIN_COOKIE = "sparesco_admin";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hostname =
    request.headers.get("host")?.split(":")[0] || "";

  const isAdminDomain = hostname === "admin.sparesco.com";

  // --------------------------------------------------
  // ADMIN DOMAIN
  // --------------------------------------------------

  if (isAdminDomain) {
    if (
      pathname.startsWith("/_next/") ||
      pathname === "/favicon.ico" ||
      pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|ico)$/i)
    ) {
      return NextResponse.next();
    }

    // Root admin domain
    if (pathname === "/") {
      const adminCookie =
        request.cookies.get(ADMIN_COOKIE)?.value;

      if (
        adminCookie &&
        adminCookie === process.env.ADMIN_SESSION_TOKEN
      ) {
        return NextResponse.redirect(
          new URL("/admin/vendors", request.url)
        );
      }

      return NextResponse.redirect(
        new URL("/admin/login", request.url)
      );
    }


    // Allow admin login page and authentication APIs
    if (
      pathname === "/admin/login" ||
      pathname === "/api/admin/login" ||
      pathname === "/api/admin/login/verify-otp"
    ) {
      return NextResponse.next();
    }

    // Protect admin pages
    if (pathname.startsWith("/admin/")) {
      const adminCookie =
        request.cookies.get(ADMIN_COOKIE)?.value;

      if (
        adminCookie &&
        adminCookie === process.env.ADMIN_SESSION_TOKEN
      ) {
        return NextResponse.next();
      }

      return NextResponse.redirect(
        new URL("/admin/login", request.url)
      );
    }

    // Protect admin APIs
    if (pathname.startsWith("/api/admin/")) {
      const adminCookie =
        request.cookies.get(ADMIN_COOKIE)?.value;

      if (
        adminCookie &&
        adminCookie === process.env.ADMIN_SESSION_TOKEN
      ) {
        return NextResponse.next();
      }

      return NextResponse.json(
        {
          success: false,
          error: "Admin authentication required.",
        },
        { status: 401 }
      );
    }

    // Anything else on admin.sparesco.com
    // gets sent back to admin
    return NextResponse.redirect(
      new URL("/admin/login", request.url)
    );
  }

  // --------------------------------------------------
  // BLOCK ADMIN AREA ON NORMAL SPARESCO DOMAIN
  // --------------------------------------------------

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin")
  ) {
    return NextResponse.redirect(
      new URL("/", request.url)
    );
  }

  // --------------------------------------------------
  // EXISTING WEBSITE PASSWORD PROTECTION
  // --------------------------------------------------

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