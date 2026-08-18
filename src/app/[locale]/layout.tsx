import type { Metadata } from "next";
import { notoSansKr } from "@/styles/fonts";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
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

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${notoSansKr.variable} font-sans`}>
        <NextIntlClientProvider messages={messages}>
          <AppProviders>{children}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
