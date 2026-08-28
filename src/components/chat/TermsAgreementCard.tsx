"use client";

import { useState } from "react";
import { ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Term {
  id: string;
  label: string;
  required: boolean;
  detail?: string;
}

const TERMS: Term[] = [
  {
    id: "service",
    label: "LG U+ 서비스 이용약관",
    required: true,
    detail: "LG U+ 서비스 이용에 관한 기본 약관입니다.",
  },
  {
    id: "privacy",
    label: "개인정보 수집·이용 동의",
    required: true,
    detail: "서비스 제공을 위한 개인정보 처리 동의입니다.",
  },
  {
    id: "credit",
    label: "신용정보 조회·이용 동의",
    required: true,
    detail: "요금 납부 신용도 확인을 위한 조회 동의입니다.",
  },
  {
    id: "marketing",
    label: "마케팅 정보 수신 동의",
    required: false,
    detail: "이벤트·혜택 안내 수신에 대한 선택 동의입니다.",
  },
];

interface TermsAgreementCardProps {
  onAgree?: (message: string) => void;
}

/**
 * 약관 동의 카드.
 * 체크박스를 직접 클릭해 동의하고, 필수 항목 전체 동의 시 "동의하기" 버튼으로 진행.
 */
export function TermsAgreementCard({ onAgree }: TermsAgreementCardProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  const allRequired = TERMS.filter((t) => t.required);
  const allOptional = TERMS.filter((t) => !t.required);

  const allRequiredChecked = allRequired.every((t) => checked[t.id]);
  const allChecked = TERMS.every((t) => checked[t.id]);

  const toggleCheck = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = () => {
    if (allChecked) {
      setChecked({});
    } else {
      const all: Record<string, boolean> = {};
      TERMS.forEach((t) => {
        all[t.id] = true;
      });
      setChecked(all);
    }
  };

  const handleAgree = () => {
    if (!allRequiredChecked) return;
    const optionalAgreed = allOptional
      .filter((t) => checked[t.id])
      .map((t) => t.label);
    const message =
      optionalAgreed.length > 0
        ? `동의합니다 (선택 동의: ${optionalAgreed.join(", ")})`
        : "동의합니다";
    onAgree?.(message);
  };

  const TermRow = ({ term }: { term: Term }) => (
    <div key={term.id} className="flex flex-col">
      <div className="flex items-center justify-between py-xs">
        {/* 체크박스 영역 */}
        <button
          type="button"
          onClick={() => toggleCheck(term.id)}
          className="flex items-center gap-xs flex-1 text-left"
        >
          {checked[term.id] ? (
            <CheckCircle2 size={15} className="text-action-primary shrink-0" />
          ) : (
            <Circle size={15} className="text-border-strong shrink-0" />
          )}
          <span
            className={cn(
              "font-sans text-caption-12-medium",
              checked[term.id] ? "text-text-primary" : "text-text-secondary",
            )}
          >
            {term.label}
            {term.required ? (
              <span className="text-error ml-xs text-[10px]">(필수)</span>
            ) : (
              <span className="text-text-tertiary ml-xs text-[10px]">
                (선택)
              </span>
            )}
          </span>
        </button>
        {/* 펼치기 버튼 */}
        <button
          type="button"
          onClick={() => setExpanded(expanded === term.id ? null : term.id)}
          className="p-xs -mr-xs"
        >
          <ChevronRight
            size={13}
            className={cn(
              "text-text-tertiary transition-transform duration-200 shrink-0",
              expanded === term.id && "rotate-90",
            )}
          />
        </button>
      </div>
      {expanded === term.id && (
        <p className="font-sans text-[10px] leading-[14px] text-text-secondary bg-surface-raised rounded-md px-sm py-xs ml-[22px] mb-xs">
          {term.detail}
        </p>
      )}
    </div>
  );

  return (
    <div className="w-[290px] rounded-lg border border-border-default bg-surface p-lg flex flex-col gap-md shadow-sm">
      <div className="flex items-center justify-between">
        <strong className="font-sans text-caption-13-bold text-text-primary">
          약관 동의 안내
        </strong>
        {/* 전체 동의 */}
        <button
          type="button"
          onClick={toggleAll}
          className="flex items-center gap-xs"
        >
          {allChecked ? (
            <CheckCircle2 size={14} className="text-action-primary" />
          ) : (
            <Circle size={14} className="text-border-strong" />
          )}
          <span className="font-sans text-[11px] text-text-secondary">
            전체 동의
          </span>
        </button>
      </div>

      {/* 필수 약관 */}
      <div className="flex flex-col gap-xs border-t border-border-default pt-sm">
        {allRequired.map((term) => (
          <TermRow key={term.id} term={term} />
        ))}
      </div>

      {/* 선택 약관 */}
      <div className="flex flex-col gap-xs border-t border-border-default pt-sm">
        {allOptional.map((term) => (
          <TermRow key={term.id} term={term} />
        ))}
      </div>

      {/* 동의하기 버튼 */}
      <button
        type="button"
        onClick={handleAgree}
        disabled={!allRequiredChecked}
        className={cn(
          "w-full h-[36px] rounded-lg font-sans text-caption-13-bold transition-colors",
          allRequiredChecked
            ? "bg-action-primary text-text-on-primary hover:bg-action-primary-hover"
            : "bg-surface-raised text-text-tertiary cursor-not-allowed",
        )}
      >
        동의하기
      </button>
    </div>
  );
}
