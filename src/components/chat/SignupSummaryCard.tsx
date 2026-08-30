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

  const rows: SummaryRow[] = [
    { label: "요금제", value: plan?.name },
    {
      label: "월 요금",
      value: plan?.monthlyFee
        ? `${plan.monthlyFee.toLocaleString()}원`
        : undefined,
    },
    { label: "이름", value: signupData.name },
    { label: "생년월일", value: formatBirth(signupData.birth) },
    { label: "결제 수단", value: signupData.paymentMethod },
  ];

  const benefitEntries = signupData.selectedBenefits
    ? Object.entries(signupData.selectedBenefits)
    : [];

  const visibleRows = rows.filter(({ value }) => !!value);

  return (
    <div className="w-[290px] rounded-xl border border-border-default bg-surface shadow-sm overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center gap-xs px-lg pt-md pb-sm border-b border-border-default">
        <CheckCircle2 size={13} className="text-action-primary shrink-0" />
        <strong className="font-sans text-caption-13-bold text-text-primary">
          가입 정보 최종 확인
        </strong>
      </div>

      {/* 기본 정보 */}
      <div className="flex flex-col px-lg py-md gap-sm">
        {visibleRows.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between gap-md">
            <span className="font-sans text-[11px] text-text-tertiary shrink-0">
              {label}
            </span>
            <span
              className="font-sans text-caption-12-bold text-text-primary text-right truncate"
              style={{ maxWidth: "160px" }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* 선택 혜택 */}
      {benefitEntries.length > 0 && (
        <div className="flex flex-col gap-sm px-lg pb-md border-t border-border-default pt-sm">
          <span className="font-sans text-[10px] text-text-tertiary font-medium">
            선택 혜택
          </span>
          {benefitEntries.map(([category, items]) => (
            <div
              key={category}
              className="flex items-start justify-between gap-sm"
            >
              <span className="font-sans text-[11px] text-text-tertiary shrink-0">
                {category}
              </span>
              <span className="font-sans text-[11px] text-text-primary text-right">
                {Array.isArray(items) ? items.join(", ") : items}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
