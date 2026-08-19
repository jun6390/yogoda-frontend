import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

const ONBOARDING_COOKIE = "yogoda_onboarding_completed";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const locale = routing.locales.find(
    (locale) => pathname === `/${locale}` || pathname === `/${locale}/`,
  );

  const hasCompletedOnboarding =
    request.cookies.get(ONBOARDING_COOKIE)?.value === "true";

  // 최초 방문자가 홈으로 진입하면 스플래시로 이동
  if (locale && !hasCompletedOnboarding) {
    return NextResponse.redirect(new URL(`/${locale}/splash`, request.url));
  }

  return handleI18nRouting(request);
}

export const config = {
  /*
   * API, Next.js 내부 파일, 정적 파일은 locale 라우팅 대상에서 제외함
   */
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
