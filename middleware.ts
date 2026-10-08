import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { authConfigured } from "@/lib/auth";

// Routes under /admin that an unauthenticated user may reach.
const PUBLIC_ADMIN = ["/admin/login", "/admin/forgot-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Not configured yet: let requests through (dev preview). The protected
  // layout still gates real data; in production getAdmin() returns null.
  if (!authConfigured()) return NextResponse.next();

  const { response, user } = await updateSession(request);
  const isPublic = PUBLIC_ADMIN.some((p) => pathname.startsWith(p));

  // Logged out → send to login (remember where they were headed).
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Already logged in → skip the login page.
  if (user && isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
