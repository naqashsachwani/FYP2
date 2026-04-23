import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const applySecurityHeaders = (response: NextResponse) => {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Content-Security-Policy", "frame-ancestors 'none';");
  return response;
};

export default clerkMiddleware(() => {
  const response = NextResponse.next();
  return applySecurityHeaders(response);
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
