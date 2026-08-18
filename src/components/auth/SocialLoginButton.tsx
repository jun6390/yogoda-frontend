import type { ButtonHTMLAttributes } from "react";

import { Button } from "@/components/ui/Button/Button";
import { FigmaImage } from "@/components/ui/FigmaImage/FigmaImage";
import { cn } from "@/lib/utils";

type SocialProvider = "google" | "naver" | "kakao";

interface SocialLoginButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  provider: SocialProvider;
  label: string;
}

/*
 * google은 Button의 secondary와 스타일이 완전히 같아 덮어쓸 게 없음
 * naver/kakao는 Figma 토큰에 없는 provider 고유 브랜드 컬러라 임의 값으로 덮어씀
 */
const providerColorOverrides: Record<SocialProvider, string> = {
  google: "",
  naver:
    "border-transparent bg-[#03C75A] text-text-on-primary hover:border-transparent hover:bg-[#02b350]",
  kakao:
    "border-transparent bg-[#FEE500] text-[#191919] hover:border-transparent hover:bg-[#f5da00]",
};

const providerIcons: Record<SocialProvider, string> = {
  google: "/social-icons/icon-google.svg",
  naver: "/social-icons/icon-naver.svg",
  kakao: "/social-icons/icon-kakao.svg",
};

/*
 * 크기/타이포는 Button에서 그대로 상속받고 provider별 색상/아이콘만 얹음
 * Button과 별도로 높이·패딩 값을 중복 관리하지 않기 위함임
 */
export function SocialLoginButton({
  provider,
  label,
  className,
  ...props
}: SocialLoginButtonProps) {
  return (
    <Button
      variant="secondary"
      className={cn(
        "h-5xl w-full gap-sm rounded-md",
        providerColorOverrides[provider],
        className,
      )}
      {...props}
    >
      <FigmaImage alt="" src={providerIcons[provider]} className="size-xl" />
      {label}
    </Button>
  );
}
