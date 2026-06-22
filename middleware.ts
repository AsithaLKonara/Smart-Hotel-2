import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    
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
