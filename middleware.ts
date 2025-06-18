import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/login(.*)", "/signup(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
});

export const config = {
  matcher: [
    "/login(.*)",
    "/signup(.*)",
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};