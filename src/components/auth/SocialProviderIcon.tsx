import { FigmaImage } from "@/components/ui/FigmaImage/FigmaImage";
import { cn } from "@/lib/utils";
import type { SocialProvider } from "@/types/auth";

/* provider 고유 브랜드 컬러는 공통 토큰으로 치환하지 않고 인증 UI에서만 사용함 */
export const socialProviderButtonStyles: Record<SocialProvider, string> = {
  google:
    "border-[#dadce0] bg-[#ffffff] text-[#191919] hover:border-[#dadce0] hover:bg-[#f8f9fa]",
  naver:
    "border-transparent bg-[#03C75A] text-[#191919] hover:border-transparent hover:bg-[#02b350]",
  kakao:
    "border-transparent bg-[#FEE500] text-[#191919] hover:border-transparent hover:bg-[#f5da00]",
};

const providerIconSurfaceStyles: Record<SocialProvider, string> = {
  google: "border border-[#dadce0] bg-[#ffffff]",
  naver: "bg-[#03C75A]",
  kakao: "bg-[#FEE500]",
};

interface SocialProviderIconProps {
  provider: SocialProvider;
  framed?: boolean;
}

export function SocialProviderIcon({
  provider,
  framed = false,
}: SocialProviderIconProps) {
  const icon = (
    <FigmaImage
      alt=""
      src={`/social-icons/icon-${provider}.svg`}
      className={framed ? "size-lg" : "size-xl"}
    />
  );

  if (!framed) {
    return icon;
  }

  return (
    <span
      className={cn(
        "flex size-[32px] shrink-0 items-center justify-center rounded-full",
        providerIconSurfaceStyles[provider],
      )}
    >
      {icon}
    </span>
  );
}
