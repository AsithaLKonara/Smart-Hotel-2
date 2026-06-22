import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { enhancedRateLimit, createEnhancedRateLimitResponse } from "@/lib/rate-limit-enhanced";

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Apply rate limiting for sensitive routes like auth and payments
    if (path.startsWith("/api/auth") || path.startsWith("/auth")) {
      const rateLimitResult = await enhancedRateLimit(req, 'auth');
      if (!rateLimitResult.allowed) {
        return createEnhancedRateLimitResponse(rateLimitResult);
      }
    }

    if (path.startsWith("/api/webhooks/stripe") || path.includes("/payment")) {
      const rateLimitResult = await enhancedRateLimit(req, 'payment');
      if (!rateLimitResult.allowed) {
        return createEnhancedRateLimitResponse(rateLimitResult);
      }
    } else if (path.startsWith("/api/")) {
      // General API Rate Limiting for all other /api/* routes
      const rateLimitResult = await enhancedRateLimit(req, 'api');
      if (!rateLimitResult.allowed) {
        return createEnhancedRateLimitResponse(rateLimitResult);
      }
    }

    // Example of top-level role enforcement if needed:
    // If a guest tries to access admin routes, redirect them
    if (path.startsWith("/admin") && token?.roleName === "GUEST") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const path = req.nextUrl.pathname;
        
        // Public paths that do not require authentication
        if (
          path.startsWith("/auth") ||
          path.startsWith("/api/auth") ||
          path.startsWith("/api/webhooks") ||
          path === "/"
        ) {
          return true; // Always allow
        }

        // All other paths require a valid token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (e.g. logo.png)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
