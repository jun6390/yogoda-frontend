"use client";

import type { SignupCollectedData, PreselectedPlan } from "@/types/chat";

interface SignupSummaryCardProps {
  signupData: SignupCollectedData;
  plan?: PreselectedPlan;
}

interface SummaryRow {
  label: string;
  value: string | undefined;
}

/**
 * 최종 가입 정보 확인 카드.
 * 가입 플로우 final_confirm 단계에서 AI 말풍선 아래에 표시됨.
 * 수집된 정보를 한눈에 보여주며, 사용자가 "가입 신청"이라고 답하면 완료됨.
 */
export function SignupSummaryCard({
  signupData,
  plan,
}: SignupSummaryCardProps) {
  const rows: SummaryRow[] = [
    { label: "가입 유형", value: signupData.signupType },
    { label: "요금제", value: plan?.name },
    {
      label: "월 요금",
      value: plan?.monthlyFee
        ? `${plan.monthlyFee.toLocaleString()}원`
        : undefined,
    },
    { label: "결제 수단", value: signupData.paymentMethod },
    {
      label: "약관 동의",
      value: signupData.agreedToTerms ? "완료" : undefined,
    },
  ];

  const benefitEntries = signupData.selectedBenefits
    ? Object.entries(signupData.selectedBenefits)
    : [];

  return (
    <div className="w-[290px] rounded-lg border border-border-default bg-surface p-lg flex flex-col gap-md shadow-sm">
      <strong className="font-sans text-caption-13-bold text-text-primary">
        가입 정보 최종 확인
      </strong>

      {/* 기본 정보 테이블 */}
      <div className="flex flex-col gap-xs">
        {rows.map(({ label, value }) =>
          value ? (
            <div key={label} className="flex items-center justify-between">
              <span className="font-sans text-caption-12-medium text-text-tertiary">
                {label}
              </span>
              <span className="font-sans text-caption-12-bold text-text-primary">
                {value}
              </span>
            </div>
          ) : null,
        )}
      </div>

      {/* 선택 혜택 */}
      {benefitEntries.length > 0 && (
        <div className="flex flex-col gap-xs border-t border-border-default pt-md">
          <span className="font-sans text-[10px] text-text-tertiary font-medium">
            선택 혜택
          </span>
          {benefitEntries.map(([category, items]) => (
            <div
              key={category}
              className="flex items-start justify-between gap-sm"
            >
              <span className="font-sans text-caption-12-medium text-text-tertiary shrink-0">
                {category}
              </span>
              <span className="font-sans text-caption-12-medium text-text-primary text-right">
                {Array.isArray(items) ? items.join(", ") : items}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 가입 신청 안내 */}
      <div className="rounded-md bg-action-primary/5 border border-action-primary/20 px-md py-sm">
        <p className="font-sans text-[10px] leading-[14px] text-text-primary text-center">
          위 정보가 맞으시면{" "}
          <strong className="text-action-primary">&quot;가입 신청&quot;</strong>{" "}
          이라고 입력해 주세요.
        </p>
      </div>
    </div>
  );
}
