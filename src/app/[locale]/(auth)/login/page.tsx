import { getTranslations } from "next-intl/server";

import { SocialLoginButton } from "@/components/auth/SocialLoginButton";
import { FigmaImage } from "@/components/ui/FigmaImage/FigmaImage";
import { Link } from "@/i18n/navigation";

const logoImage = "/yogoda-logo.svg";

export default async function LoginPage() {
  const t = await getTranslations("Login");

  return (
    <div className="flex min-h-full flex-col justify-center gap-3xl px-page py-4xl">
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

      <div className="flex flex-col gap-md">
        <SocialLoginButton provider="google" label={t("continueWithGoogle")} />
        <SocialLoginButton provider="naver" label={t("continueWithNaver")} />
        <SocialLoginButton provider="kakao" label={t("continueWithKakao")} />
      </div>

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
  );
}
