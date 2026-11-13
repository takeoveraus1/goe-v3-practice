import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, hasAccess } from "@/lib/access";
import { homePathFor, readSessionToken, SESSION_COOKIE } from "@/lib/auth/session-token";

/**
 * Runs before every page:
 * 1. The site-wide access code (see src/lib/access.ts) – nothing, not even the
 *    login page, is reachable without it while the gate is on.
 * 2. Optimistic route protection from the signed session cookie (no database).
 *    Pages and server actions re-check the session against the database.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname !== "/access" && !(await hasAccess(request.cookies.get(ACCESS_COOKIE)?.value))) {
    const url = new URL("/access", request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  const area = pathname.startsWith("/athlete") ? "athlete" : pathname.startsWith("/coach") ? "coach" : null;
  if (!area) return NextResponse.next();

  const session = await readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (session.role !== area) {
    return NextResponse.redirect(new URL(homePathFor(session.role), request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Every page; static files, images and robots.txt pass straight through.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp|txt)$).*)"],
};
