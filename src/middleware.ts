import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

// List of public API routes that don't require authentication
const PUBLIC_API_ROUTES = [
  '/api/health-data',
  '/api/blood-markers',
];

// List of protected API routes that require authentication
const PROTECTED_API_ROUTES = [
  '/api/upload-url',
];

export async function middleware(request: NextRequest) {
  console.log('=== Middleware Start ===');
  console.log('Request path:', request.nextUrl.pathname);
  console.log('Request method:', request.method);
  console.log('Content-Type:', request.headers.get('content-type'));
  
  const token = await getToken({ req: request });
  console.log('Auth token present:', !!token);
  
  const isAuthPage = request.nextUrl.pathname.startsWith("/auth");
  const isApiAuthRoute = request.nextUrl.pathname.startsWith("/api/auth");
  const isPublicApiRoute = PUBLIC_API_ROUTES.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );
  const isProtectedApiRoute = PROTECTED_API_ROUTES.some(route =>
    request.nextUrl.pathname.startsWith(route)
  ) || (
    request.nextUrl.pathname.startsWith("/api") && 
    !isApiAuthRoute && 
    !isPublicApiRoute
  );
  const isUploadPage = request.nextUrl.pathname.startsWith("/upload");

  console.log('Route type:', {
    isAuthPage,
    isApiAuthRoute,
    isPublicApiRoute,
    isProtectedApiRoute,
    isUploadPage
  });

  // Allow public access to the dashboard, auth routes, and public API routes
  if (request.nextUrl.pathname === "/" || 
      request.nextUrl.pathname.startsWith("/dashboard") || 
      isApiAuthRoute || 
      isPublicApiRoute) {
    console.log('Allowing public access');
    return NextResponse.next();
  }

  // Protect upload page and protected API routes
  if ((isUploadPage || isProtectedApiRoute) && !token) {
    console.log('Blocking unauthorized access');
    if (request.nextUrl.pathname.startsWith("/api")) {
      console.log('Returning 401 for API route');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log('Redirecting to signin');
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  // Redirect to home if logged in user tries to access auth pages
  if (isAuthPage && token) {
    console.log('Redirecting authenticated user from auth page');
    return NextResponse.redirect(new URL("/", request.url));
  }

  console.log('=== Middleware End: Allowing access ===');
  return NextResponse.next();
}

export const config = {
  matcher: ["/upload/:path*", "/api/:path*", "/auth/:path*", "/dashboard/:path*"],
}; 