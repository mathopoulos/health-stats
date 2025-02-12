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
  '/api/parse-blood-test',
  '/api/pdf_test',
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

  // Handle API routes first
  if (request.nextUrl.pathname.startsWith("/api")) {
    // Allow auth routes
    if (isApiAuthRoute) {
      return NextResponse.next();
    }

    // Allow public routes
    if (isPublicApiRoute) {
      return NextResponse.next();
    }

    // Check authentication for protected routes
    if (!token) {
      console.log('API authentication failed');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.next();
  }

  // Handle non-API routes
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isUploadPage && !token) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/upload/:path*", "/api/:path*", "/auth/:path*", "/dashboard/:path*"],
}; 