import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

const ONBOARDING_COOKIE = "yogoda_onboarding_completed";
const AUTH_COOKIE = "yogoda_authenticated";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathLocale = routing.locales.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  const isHome =
    pathLocale &&
    (pathname === `/${pathLocale}` || pathname === `/${pathLocale}/`);
  const isLoginPage = pathLocale && pathname === `/${pathLocale}/login`;

  const hasCompletedOnboarding =
    request.cookies.get(ONBOARDING_COOKIE)?.value === "true";
  const isAuthenticated = request.cookies.get(AUTH_COOKIE)?.value === "true";

  // 로그인된 사용자가 로그인 페이지에 접근하면 홈으로 이동
  if (isLoginPage && isAuthenticated) {
    return NextResponse.redirect(new URL(`/${pathLocale}`, request.url));
  }

  // 최초 방문자가 홈으로 진입하면 스플래시로 이동 (로그인된 사용자는 온보딩을 건너뜀)
  if (isHome && !hasCompletedOnboarding && !isAuthenticated) {
    return NextResponse.redirect(new URL(`/${pathLocale}/splash`, request.url));
  }

  return handleI18nRouting(request);
}

export const config = {
  /*
   * API, /auth(OAuth 콜백 - next.config.ts rewrite가 locale 라우트로 매핑하므로 여기서 제외),
   * Next.js 내부 파일, 정적 파일은 locale 라우팅 대상에서 제외함
   */
  matcher: "/((?!api|auth|_next|_vercel|.*\\..*).*)",
};
