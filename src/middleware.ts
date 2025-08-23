import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

// List of public API routes that don't require authentication
const PUBLIC_API_ROUTES = [
  '/api/health-data',
  '/api/blood-markers',
  '/api/users',
  '/api/validate-invite',
  '/api/health-protocols',
  '/api/experiments',
  '/api/leaderboard',
  // Payment routes
  '/api/payment/check-purchase',
  '/api/payment/create-checkout',
  '/api/payment/verify-payment'
];

// List of protected API routes that require authentication
const PROTECTED_API_ROUTES = [
  '/api/upload-url',
  '/api/parse-blood-test',
  '/api/pdf_test',
  '/api/pdf',
];

export async function middleware(request: NextRequest) {
  // Normalize NextAuth callback cookie if it is missing a protocol (e.g., "staging.revly.health/upload").
  // Be defensive: in unit tests or certain runtimes, request.cookies may be undefined or not implement .get
  try {
    const cookieGetter = (request as any).cookies?.get as undefined | ((name: string) => { value?: string } | undefined);
    const callbackCookie = typeof cookieGetter === 'function' ? cookieGetter("next-auth.callback-url") : undefined;
    const callbackValue = callbackCookie?.value;
    if (callbackValue && !callbackValue.startsWith("http")) {
      const normalized = `https://${callbackValue.replace(/^\/*/, "")}`;
      const res = NextResponse.next();
      res.cookies.set("next-auth.callback-url", normalized, { path: "/", sameSite: "lax", httpOnly: true, secure: true });
      return res;
    }
  } catch {
    // If anything goes wrong reading cookies, proceed without normalization
  }

  // Comment out or remove console logs to reduce noise
  // console.log('=== Middleware Start ===');
  // console.log('Request path:', request.nextUrl.pathname);
  // console.log('Request method:', request.method);
  // console.log('Content-Type:', request.headers.get('content-type'));
  
  const token = await getToken({ req: request });
  // console.log('Auth token present:', !!token);
  
  // Handle redirects for old dashboard URL format
  if (request.nextUrl.pathname.match(/^\/dashboard\/userId=(.+)$/)) {
    const userId = request.nextUrl.pathname.replace('/dashboard/userId=', '');
    return NextResponse.redirect(new URL(`/dashboard/${userId}`, request.url));
  }
  
  const isAuthPage = request.nextUrl.pathname.startsWith("/auth");
  const isInvitePage = request.nextUrl.pathname === "/auth/invite";
  const isSignInPage = request.nextUrl.pathname === "/auth/signin";
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
  const isDashboardPage = request.nextUrl.pathname.startsWith("/dashboard");
  const isAdminPage = request.nextUrl.pathname.startsWith("/admin");

  // Special handling for iOS auth route
  const isIosAuthRoute = request.nextUrl.pathname.startsWith("/api/auth/ios");
  const isIosHealthDataRoute = request.nextUrl.pathname.startsWith("/api/health-data/ios");
  
  // If this is an iOS-specific route, allow it without general auth checks
  // The iOS routes handle their own authentication with JWT verification
  if (isIosAuthRoute || isIosHealthDataRoute) {
    return NextResponse.next();
  }

  // console.log('Route type:', {
  //   isAuthPage,
  //   isInvitePage,
  //   isSignInPage,
  //   isApiAuthRoute,
  //   isPublicApiRoute,
  //   isProtectedApiRoute,
  //   isUploadPage,
  //   isDashboardPage
  // });

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
      // console.log('API authentication failed');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.next();
  }

  // Handle non-API routes
  
  // Allow dashboard pages for both authenticated and unauthenticated users
  if (isDashboardPage) {
    const response = NextResponse.next();
    response.headers.set('x-pathname', request.nextUrl.pathname);
    return response;
  }
  
  // If user is authenticated and trying to access auth pages, redirect to home
  if (isAuthPage && token && !isInvitePage) {
    return NextResponse.redirect(new URL("/upload", request.url));
  }

  // If user is not authenticated and trying to access upload page, redirect to sign-in page
  if (isUploadPage && !token) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  // If user is trying to access admin pages, redirect to sign-in if not authenticated
  if (isAdminPage && !token) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  const response = NextResponse.next();
  response.headers.set('x-pathname', request.nextUrl.pathname);
  return response;
}

export const config = {
  // Include root path so normalization also runs on the landing page
  matcher: ["/", "/upload/:path*", "/api/:path*", "/auth/:path*", "/dashboard/:path*", "/admin/:path*"],
}; 