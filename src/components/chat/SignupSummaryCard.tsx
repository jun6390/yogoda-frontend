"use client";

import { CheckCircle2 } from "lucide-react";
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
 */
export function SignupSummaryCard({
  signupData,
  plan,
}: SignupSummaryCardProps) {
  const formatBirth = (birth?: string) => {
    if (!birth || birth.length !== 8) return birth;
    return `${birth.slice(0, 4)}.${birth.slice(4, 6)}.${birth.slice(6, 8)}`;
  };

  const benefitEntries = signupData.selectedBenefits
    ? Object.entries(signupData.selectedBenefits)
    : [];

  // 혜택을 하나의 문자열로 합쳐서 행으로 표시
  const benefitValue =
    benefitEntries.length > 0
      ? benefitEntries
          .map(([, items]) => (Array.isArray(items) ? items.join(", ") : items))
          .join(" / ")
      : undefined;

  const rows: SummaryRow[] = [
    { label: "요금제", value: plan?.name },
    {
      label: "월 요금",
      value: plan?.monthlyFee
        ? `${plan.monthlyFee.toLocaleString()}원`
        : undefined,
    },
    { label: "선택 혜택", value: benefitValue },
    { label: "이름", value: signupData.name },
    { label: "생년월일", value: formatBirth(signupData.birth) },
    { label: "휴대폰 번호", value: signupData.phoneNumber },
    { label: "결제 수단", value: signupData.paymentMethod },
  ];

  const visibleRows = rows.filter(({ value }) => !!value);

  return (
    <div className="w-full rounded-[12px] rounded-tl-[4px] border border-border-default bg-surface shadow-sm overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center gap-xs px-lg pt-md pb-sm border-b border-border-default">
        <CheckCircle2 size={13} className="text-action-primary shrink-0" />
        <strong className="font-sans text-caption-13-bold text-text-primary">
          가입 정보 최종 확인
        </strong>
      </div>

      {/* 가입 정보 목록 */}
      <div className="flex flex-col px-lg py-md gap-sm">
        {visibleRows.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between gap-md">
            <span className="font-sans text-[11px] text-text-tertiary shrink-0">
              {label}
            </span>
            <span
              className="font-sans text-caption-12-bold text-text-primary text-right"
              style={{ maxWidth: "160px" }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
