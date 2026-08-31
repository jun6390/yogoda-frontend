"use client";

/**
 * 명의도용 방지 안내 카드.
 * 가입 플로우 fraud_warning 단계에서 AI 말풍선 아래에 표시됨.
 * 확인은 채팅 퀵응답("확인했어요")으로 진행.
 */
export function FraudWarningCard() {
  return (
    <div className="w-full rounded-[12px] rounded-tl-[4px] border border-border-default bg-surface shadow-sm overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center gap-sm px-lg pt-md pb-sm">
        <strong className="font-sans text-caption-13-bold text-text-primary">
          명의도용 방지 서비스 안내
        </strong>
      </div>

      {/* 구분선 */}
      <div className="mx-lg border-t border-border-default" />

      {/* 항목 */}
      <ul className="flex flex-col gap-xs px-lg py-md">
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
            <span className="mt-[5px] shrink-0 size-[3px] rounded-full bg-text-tertiary" />
            {text}
          </li>
        ))}
      </ul>

      {/* 하단 안내 */}
      <div className="px-lg pb-md">
        <p className="font-sans text-[10px] text-text-tertiary text-center">
          아래 채팅으로 확인 후 다음 단계로 진행해 주세요.
        </p>
      </div>
    </div>
  );
}
