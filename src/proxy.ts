import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // TODO: Enable auth check once redirect URI is set up in Entra ID
  // For now, allow all requests through
  if (process.env.AUTH_ENABLED === "true") {
    const token =
      request.cookies.get("authjs.session-token")?.value ??
      request.cookies.get("__Secure-authjs.session-token")?.value;

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/submit/:path*",
    "/tickets/:path*",
    "/dashboard/:path*",
    "/debug/:path*",
  ],
};
