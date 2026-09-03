"use client";

import { ShieldAlert } from "lucide-react";

/**
 * 명의도용 방지 안내 카드.
 * 가입 플로우 fraud_warning 단계에서 AI 말풍선 아래에 표시됨.
 * 버튼 없이, 사용자가 퀵답변이나 직접 채팅으로 확인 의사를 답장하면 AI가 그 내용을
 * 판단해서 다음 단계로 넘어감 (긍정 답변이 아니면 이 단계를 다시 안내함).
 */
export function FraudWarningCard() {
  return (
    <div className="w-full rounded-md rounded-tl-xs border border-warning/30 bg-surface shadow-sm overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center gap-sm bg-warning/10 px-lg py-md">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-warning/20 text-warning">
          <ShieldAlert size={16} aria-hidden="true" />
        </span>
        <strong className="font-sans text-caption-13-bold text-text-primary">
          명의도용 방지 서비스 안내
        </strong>
      </div>

      {/* 항목 */}
      <ul className="flex flex-col gap-sm px-lg py-md">
        {[
          "본인 명의로만 가입이 가능합니다.",
          "타인 명의 도용 시 법적 처벌을 받을 수 있습니다.",
          "가입 후 요금은 명의자에게 청구됩니다.",
          "이상 거래 감지 시 가입이 제한될 수 있습니다.",
        ].map((text) => (
          <li
            key={text}
            className="flex items-start gap-sm font-sans text-caption-12-medium text-text-secondary"
          >
            <span className="mt-1 shrink-0 size-xs rounded-full bg-warning/60" />
            {text}
          </li>
        ))}
      </ul>

      {/* 하단 안내 */}
      <div className="mx-lg mb-lg rounded-md bg-surface-subtle px-md py-sm">
        <p className="font-sans text-micro-11-regular text-text-secondary text-center">
          아래 채팅으로 확인 후 다음 단계로 진행해 주세요.
        </p>
      </div>
    </div>
  );
}
