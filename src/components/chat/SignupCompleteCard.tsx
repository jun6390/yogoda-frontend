"use client";

import { CheckCircle2, ChevronRight } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import type { PreselectedPlan } from "@/types/chat";

interface SignupCompleteCardProps {
  plan?: PreselectedPlan;
}

/**
 * 가입 완료 카드.
 * 가입 플로우 completed 단계에서 AI 말풍선 아래에 표시됨.
 */
export function SignupCompleteCard({ plan }: SignupCompleteCardProps) {
  const router = useRouter();

  return (
    <div className="w-[290px] rounded-lg border border-success/30 bg-success/5 p-lg flex flex-col gap-md shadow-sm">
      {/* 완료 아이콘 + 제목 */}
      <div className="flex flex-col items-center gap-sm pt-xs">
        <CheckCircle2 size={36} className="text-success" />
        <div className="text-center">
          <strong className="block font-sans text-title-18-bold text-text-primary">
            가입 신청 완료!
          </strong>
          {plan && (
            <span className="font-sans text-caption-12-medium text-text-secondary">
              {plan.name}
            </span>
          )}
        </div>
      </div>

      {/* 안내 메시지 */}
      <div className="flex flex-col gap-xs border-t border-border-default pt-md">
        {[
          "영업일 기준 1~3일 내에 개통이 완료됩니다.",
          "개통 완료 시 SMS로 안내해 드립니다.",
          "문의사항은 고객센터(114)로 연락해 주세요.",
        ].map((text) => (
          <div key={text} className="flex items-start gap-xs">
            <span className="mt-[4px] shrink-0 size-[4px] rounded-full bg-text-tertiary" />
            <span className="font-sans text-caption-12-medium text-text-secondary">
              {text}
            </span>
          </div>
        ))}
      </div>

      {/* 행동 버튼 */}
      <div className="flex flex-col gap-xs pt-xs">
        <button
          type="button"
          onClick={() => router.push("/mypage")}
          className="w-full h-[40px] rounded-lg bg-action-primary text-text-on-primary font-sans text-caption-13-bold hover:bg-action-primary-hover transition-colors"
        >
          마이페이지에서 확인
        </button>
        <button
          type="button"
          onClick={() => router.push("/plans")}
          className="flex items-center justify-center gap-xs font-sans text-caption-12-medium text-text-secondary hover:text-text-primary"
        >
          요금제 둘러보기 <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
