import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

// List of public API routes that don't require authentication
const PUBLIC_API_ROUTES = [
  '/api/health-data',
  '/api/blood-markers',
];

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuthPage = request.nextUrl.pathname.startsWith("/auth");
  const isApiAuthRoute = request.nextUrl.pathname.startsWith("/api/auth");
  const isPublicApiRoute = PUBLIC_API_ROUTES.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );
  const isProtectedApiRoute = request.nextUrl.pathname.startsWith("/api") && 
    !isApiAuthRoute && 
    !isPublicApiRoute;
  const isUploadPage = request.nextUrl.pathname.startsWith("/upload");

  // Allow public access to the dashboard, auth routes, and public API routes
  if (request.nextUrl.pathname === "/" || request.nextUrl.pathname === "/dashboard" || isApiAuthRoute || isPublicApiRoute) {
    return NextResponse.next();
  }

  // Protect upload page and protected API routes
  if ((isUploadPage || isProtectedApiRoute) && !token) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  // Redirect to home if logged in user tries to access auth pages
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/upload/:path*", "/api/:path*", "/auth/:path*", "/dashboard"],
}; 