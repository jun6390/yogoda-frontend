"use client";

import { useRouter } from "@/i18n/navigation";
import { PlanSuccessContent } from "@/components/plan/PlanSuccessContent";
import { Button } from "@/components/ui/Button/Button";
import { Link } from "@/i18n/navigation";

/**
 * 가입 완료 인라인 카드 (채팅 내 풀너비 페이지형).
 * PlanSuccessContent를 채팅 variant로 렌더링.
 */
export function SignupCompleteCard() {
  const router = useRouter();

  return (
    <PlanSuccessContent
      variant="chat"
      actions={
        <div className="flex flex-col gap-sm">
          <Button
            variant="secondary"
            className="w-full h-[44px]"
            onClick={() => router.push("/my")}
          >
            마이페이지에서 확인
          </Button>
          <Link
            href="/"
            className="flex h-[40px] w-full items-center justify-center font-sans text-caption-12-medium text-text-secondary hover:text-text-primary"
          >
            홈으로 가기
          </Link>
        </div>
      }
    />
  );
}
