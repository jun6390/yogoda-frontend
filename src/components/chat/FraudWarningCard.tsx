"use client";

import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button/Button";

interface FraudWarningCardProps {
  onConfirm?: () => void;
}

/**
 * 명의도용 방지 안내 카드.
 * 가입 플로우 fraud_warning 단계에서 AI 말풍선 아래에 표시됨.
 * "확인했습니다" 버튼을 누르면 다음 단계로 진행됨.
 */
export function FraudWarningCard({ onConfirm }: FraudWarningCardProps) {
  return (
    <div className="w-[290px] rounded-xl border border-warning/50 bg-warning/8 flex flex-col overflow-hidden shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center gap-sm bg-warning/15 px-lg py-md">
        <ShieldAlert size={16} className="text-warning shrink-0" />
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
            <span className="mt-[4px] shrink-0 size-[4px] rounded-full bg-warning" />
            {text}
          </li>
        ))}
      </ul>

      {/* 확인 버튼 */}
      <div className="px-lg pb-lg pt-xs">
        <Button
          variant="secondary"
          className="w-full h-[36px]"
          onClick={onConfirm}
        >
          확인했습니다
        </Button>
      </div>
    </div>
  );
}
