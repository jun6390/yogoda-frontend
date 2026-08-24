import type { Metadata } from "next";
import { notoSansKr } from "@/styles/fonts";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { notFound } from "next/navigation";

import { routing } from "@/i18n/routing";
import { AppProviders } from "@/providers/app-providers";

import "../globals.css";

interface LocaleParamsProps {
  params: Promise<{
    locale: string;
  }>;
}

interface LocaleLayoutProps extends LocaleParamsProps {
  children: React.ReactNode;
}

export async function generateMetadata({
  params,
}: LocaleParamsProps): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "Common" });

  return {
    title: t("serviceName"),
    description: t("title"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  /*
   * URL로 지원하지 않는 locale이 들어오는 경우임
   * 잘못된 언어 페이지를 렌더링하지 않고 404로 처리함
   */
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  /*
   * /auth/:provider/callback rewrite처럼 next-intl 미들웨어를 거치지 않고
   * 들어오는 요청도 있어서, URL의 [locale] 세그먼트로 직접 locale을 고정함
   */
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* hydration 전에 dark 클래스를 먼저 붙여 테마 깜빡임(FOUC)을 막음 (theme-provider.tsx와 동일 로직) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");var isDark=t==="dark"||((!t||t==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(isDark){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark";}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${notoSansKr.variable} font-sans`}>
        <NextIntlClientProvider messages={messages}>
          <AppProviders>{children}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
