import { Home } from "lucide-react";
import Image from "next/image";
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
    <PageContainer className="relative flex min-h-full flex-col items-center justify-center overflow-hidden py-5xl text-center">
      {/* 배경에 은은하게 떠 있는 브랜드 컬러 글로우 (glow-accent는 테마별 대비를 위한 전용 토큰) */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[6%] left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-glow-accent opacity-80 blur-3xl"
      />

      <div className="relative flex flex-col items-center">
        <div className="motion-safe:animate-[float404_3.2s_ease-in-out_infinite]">
          <Image
            src="/yogoda-characters/404-sleeping.png"
            alt=""
            width={220}
            height={190}
            className="h-[190px] w-[220px] object-contain drop-shadow-[0_10px_14px_rgba(224,20,133,0.16)]"
            priority
          />
        </div>

        <span className="mt-xl inline-flex items-center gap-xs rounded-full bg-brand-soft px-lg py-xs font-sans text-caption-13-bold text-text-brand">
          {t("label")}
        </span>

        <h1 className="mt-sm font-sans text-title-20-bold whitespace-pre-line text-text-primary">
          {t("title")}
        </h1>

        <p className="mt-sm max-w-[260px] font-sans text-body-14-regular whitespace-pre-line text-text-secondary">
          {t("description")}
        </p>

        <Link
          href="/"
          className="mt-2xl inline-flex h-[44px] items-center justify-center gap-sm rounded-lg bg-action-primary px-xl font-sans text-label-14-bold text-text-on-primary transition-colors hover:bg-action-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
        >
          <Home size={16} strokeWidth={2} />
          {t("homeAction")}
        </Link>
      </div>
    </PageContainer>
  );
}
