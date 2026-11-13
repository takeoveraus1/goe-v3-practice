import { NextResponse, type NextRequest } from "next/server";
import { homePathFor, readSessionToken, SESSION_COOKIE } from "@/lib/auth/session-token";

/**
 * Optimistic route protection: reads the signed session cookie only (no database).
 * Pages and server actions re-check the session against the database.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  const area = pathname.startsWith("/athlete") ? "athlete" : pathname.startsWith("/coach") ? "coach" : null;
  if (!area) return NextResponse.next();

  if (!session) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }
  if (session.role !== area) {
    return NextResponse.redirect(new URL(homePathFor(session.role), request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/athlete/:path*", "/coach/:path*"],
};
