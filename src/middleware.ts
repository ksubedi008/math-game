import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isAuthenticated = !!req.auth;
  const isDashboardOrGame = req.nextUrl.pathname.startsWith("/dashboard") || req.nextUrl.pathname.startsWith("/game");

  if (isDashboardOrGame && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
