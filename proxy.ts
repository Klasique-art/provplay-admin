import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const authenticated = request.cookies.has("__Host-provplay_admin_access") || request.cookies.has("provplay_admin_access");
  const loginPage = request.nextUrl.pathname === "/login";

  if (loginPage && authenticated) return NextResponse.redirect(new URL("/", request.url));
  if (!loginPage && !authenticated) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
