import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;

  /*
   * 지원하지 않는 locale이 들어온 경우 기본 언어로 처리함
   * 지원 언어 목록은 routing.ts를 기준으로 관리함
   *
   * hasLocale을 사용해 지원 언어 여부를 검사함
   * "ko" | "en" 같은 타입을 직접 단언하지 않아도 됨
   */
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
