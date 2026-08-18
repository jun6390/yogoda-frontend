import { Home, SearchX } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PageContainer } from "@/components/layout/PageContainer";
import { Link } from "@/i18n/navigation";

export default async function NotFoundPage() {
  /*
   * not-found 파일은 params를 받지 않음
   * next-intl 요청 컨텍스트에서 현재 locale 번역을 가져옴
   */
  const t = await getTranslations("NotFound");

  return (
    <PageContainer className="flex min-h-full flex-col items-center justify-center py-5xl text-center">
      <span className="flex size-[72px] items-center justify-center rounded-full bg-brand-soft text-icon-brand">
        <SearchX size={34} strokeWidth={1.8} />
      </span>

      <p className="mt-xl font-sans text-caption-13-bold text-text-brand">
        {t("label")}
      </p>

      <h1 className="mt-sm font-sans text-title-24-bold text-text-primary">
        {t("title")}
      </h1>

      <p className="mt-md max-w-[280px] font-sans text-body-14-regular text-text-secondary">
        {t("description")}
      </p>

      <Link
        href="/"
        className="mt-2xl inline-flex h-[48px] w-full max-w-[220px] items-center justify-center gap-sm rounded-lg bg-action-primary px-xl font-sans text-label-14-bold text-text-on-primary transition-colors hover:bg-action-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
      >
        <Home size={18} strokeWidth={1.9} />
        {t("homeAction")}
      </Link>
    </PageContainer>
  );
}
