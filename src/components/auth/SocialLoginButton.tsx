import type { ButtonHTMLAttributes } from "react";

import { Button } from "@/components/ui/Button/Button";
import {
  SocialProviderIcon,
  socialProviderButtonStyles,
} from "@/components/auth/SocialProviderIcon";
import { cn } from "@/lib/utils";
import type { SocialProvider } from "@/types/auth";

interface SocialLoginButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  provider: SocialProvider;
  label: string;
}

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
        socialProviderButtonStyles[provider],
        className,
      )}
      {...props}
    >
      <SocialProviderIcon provider={provider} />
      {label}
    </Button>
  );
}
