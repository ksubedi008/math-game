import NextAuth from "next-auth";
import { NextResponse } from "next/server";

// FIX: Initialize a lightweight, Edge-only auth instance that bypasses the database
const { auth: edgeAuth } = NextAuth({
  providers: [],
});

export default edgeAuth((req) => {
  const isAuthenticated = !!req.auth;
  const isDashboardOrGame = req.nextUrl.pathname.startsWith("/dashboard") || req.nextUrl.pathname.startsWith("/game");

  if (isDashboardOrGame && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};