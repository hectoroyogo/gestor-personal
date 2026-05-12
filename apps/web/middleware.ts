import { NextResponse, type NextRequest } from "next/server";

const cookieName = process.env.COOKIE_NAME ?? "gestor_session";

export function middleware(request: NextRequest) {
  const session = request.cookies.get(cookieName)?.value;
  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/register");
  const isAppPage = request.nextUrl.pathname.startsWith("/dashboard");

  if (isAppPage && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"]
};

