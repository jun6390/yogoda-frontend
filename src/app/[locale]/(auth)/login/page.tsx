"use client";

import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";

import { SocialLoginGroup } from "@/components/auth/SocialLoginGroup";
import { FigmaImage } from "@/components/ui/FigmaImage/FigmaImage";
import { Link, useRouter } from "@/i18n/navigation";

const logoImage = "/yogoda-logo.svg";

export default function LoginPage() {
  const t = useTranslations("Login");
  const router = useRouter();

  return (
    <div className="flex min-h-full flex-col px-page py-4xl">
      <header className="flex items-center">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label={t("back")}
          className="flex size-[24px] items-center justify-center text-icon-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
        >
          <ChevronLeft aria-hidden="true" size={24} strokeWidth={2} />
        </button>
      </header>

      <div className="flex flex-1 flex-col justify-center gap-3xl">
        <div className="flex flex-col items-center gap-md text-center">
          <div className="flex flex-col items-center gap-lg">
            <FigmaImage
              alt={t("serviceName")}
              src={logoImage}
              className="h-3xl w-auto"
            />
            <p className="font-sans text-title-18-bold text-text-primary">
              {t("heading")}
            </p>
          </div>

          <p className="whitespace-pre-line font-sans text-body-14-regular text-text-secondary">
            {t("description")}
          </p>
        </div>

        <SocialLoginGroup
          labels={{
            google: t("continueWithGoogle"),
            naver: t("continueWithNaver"),
            kakao: t("continueWithKakao"),
          }}
        />

        <p className="whitespace-pre-line text-center font-sans text-caption-12-regular text-text-tertiary">
          {t.rich("legalNotice", {
            terms: (chunks) => (
              <Link href="/terms" className="text-text-secondary underline">
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link href="/privacy" className="text-text-secondary underline">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    </div>
  );
}
