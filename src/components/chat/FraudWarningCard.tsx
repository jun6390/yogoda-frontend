"use client";

import { AlertTriangle } from "lucide-react";

/**
 * 명의도용 방지 안내 카드.
 * 가입 플로우 fraud_warning 단계에서 AI 말풍선 아래에 표시됨.
 * 사용자가 "확인했습니다"라고 답하면 다음 단계로 진행됨.
 */
export function FraudWarningCard() {
  return (
    <div className="w-[290px] rounded-lg border border-warning/40 bg-warning/5 p-lg flex flex-col gap-md">
      <div className="flex items-center gap-sm">
        <AlertTriangle size={18} className="text-warning shrink-0" />
        <strong className="font-sans text-caption-13-bold text-text-primary">
          명의도용 방지 서비스 안내
        </strong>
      </div>

      <ul className="flex flex-col gap-xs">
        {[
          "본인 명의로만 가입이 가능합니다.",
          "타인 명의 도용 시 법적 처벌을 받을 수 있습니다.",
          "가입 후 요금은 명의자에게 청구됩니다.",
          "이상 거래 감지 시 가입이 제한될 수 있습니다.",
        ].map((text) => (
          <li
            key={text}
            className="flex items-start gap-xs font-sans text-caption-12-medium text-text-secondary"
          >
            <span className="mt-[3px] shrink-0 size-[5px] rounded-full bg-text-tertiary" />
            {text}
          </li>
        ))}
      </ul>

      <p className="font-sans text-[10px] leading-[14px] text-text-tertiary border-t border-border-default pt-md">
        위 내용을 확인하셨으면 채팅창에{" "}
        <strong className="text-text-secondary">
          &quot;확인했습니다&quot;
        </strong>
        라고 입력해 주세요.
      </p>
    </div>
  );
}
