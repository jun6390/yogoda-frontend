import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  /*
   * API, Next.js 내부 파일, 정적 파일은 locale 라우팅 대상에서 제외함
   */
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
