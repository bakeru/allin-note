import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware-client";

export async function middleware(request: NextRequest) {
  const { supabase, response } = await updateSession(request);

  if (
    process.env.NEXT_PUBLIC_AUTH_MODE === "mock" ||
    process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true"
  ) {
    return response;
  }

  const pathname = request.nextUrl.pathname;
  const isPublicRoute =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/invite/") ||
    pathname.startsWith("/api/");

  if (isPublicRoute || !supabase) {
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return response;
  }

  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
