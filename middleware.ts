import { default as globalConfig } from "@/lib/config"
import { getSessionCookie } from "better-auth/cookies"
import { NextRequest, NextResponse } from "next/server"

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (globalConfig.selfHosted.isEnabled) {
    // In self-hosted mode, check if setup wizard is complete via cookie.
    // Prisma is not available in Edge middleware, so we use a cookie flag
    // that is set after the setup wizard completes.
    const setupComplete = request.cookies.get("banchee_setup_complete")?.value

    if (!setupComplete && !pathname.startsWith("/setup") && !pathname.startsWith("/api")) {
      return NextResponse.redirect(new URL("/setup", request.url))
    }

    return NextResponse.next()
  }

  const sessionCookie = getSessionCookie(request, { cookiePrefix: "banchee" })
  if (!sessionCookie) {
    return NextResponse.redirect(new URL(globalConfig.auth.loginUrl, request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/transactions/:path*",
    "/settings/:path*",
    "/export/:path*",
    "/import/:path*",
    "/unsorted/:path*",
    "/files/:path*",
    "/dashboard/:path*",
    "/setup/:path*",
    "/apps/:path*",
  ],
}
