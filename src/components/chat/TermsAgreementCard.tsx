"use client";

import { useEffect, useState } from "react";
import { ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet } from "@/components/ui/Sheet/Sheet";
import { Button } from "@/components/ui/Button/Button";

const CHECKED_STORAGE_KEY = "termsAgreementChecked";

function readStoredChecked(): Record<string, boolean> {
  try {
    const stored = sessionStorage.getItem(CHECKED_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

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
    detail:
      "본 약관은 LG유플러스㈜(이하 '회사')가 제공하는 이동통신 서비스의 이용에 관한 회사와 이용자 간의 권리·의무 및 책임 사항을 규정합니다.\n\n" +
      "제1조 (목적) 본 약관은 회사가 제공하는 이동통신 서비스 이용과 관련하여 회사와 이용자의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.\n\n" +
      "제2조 (이용계약의 체결) 이용계약은 이용자가 본 약관에 동의하고 회사가 정한 절차에 따라 이용 신청을 하면 회사가 이를 승낙함으로써 체결됩니다.\n\n" +
      "제3조 (요금 납부) 이용자는 회사가 청구하는 요금을 지정 납부일까지 납부하여야 하며, 요금 미납 시 서비스 이용이 제한될 수 있습니다.\n\n" +
      "제4조 (서비스 변경·중지) 회사는 전기통신사업법 등 관련 법령에 따라 서비스의 내용을 변경하거나 중지할 수 있으며, 이 경우 사전에 고지합니다.",
  },
  {
    id: "privacy",
    label: "개인정보 수집·이용 동의",
    required: true,
    detail:
      "LG유플러스㈜는 이동통신 서비스 제공을 위해 아래와 같이 개인정보를 수집·이용합니다.\n\n" +
      "【수집 항목】\n성명, 생년월일, 성별, 내/외국인 구분, 휴대폰 번호, 주소, 이메일, 납부 계좌 또는 신용카드 정보\n\n" +
      "【이용 목적】\n본인 확인 및 서비스 신청·개통, 요금 청구 및 수납, 서비스 품질 관리, 민원 처리 및 분쟁 해결\n\n" +
      "【보유 기간】\n서비스 이용 기간 및 관계 법령에 따른 보유 기간 (통신비밀보호법에 따라 통화 내역 최대 12개월, 요금 관련 기록 5년 보관)\n\n" +
      "동의를 거부할 권리가 있으나, 거부 시 서비스 가입이 불가합니다.",
  },
  {
    id: "credit",
    label: "신용정보 조회·이용 동의",
    required: true,
    detail:
      "LG유플러스㈜는 이동통신 서비스 가입 심사를 위해 귀하의 신용정보를 조회합니다.\n\n" +
      "【조회 기관】\nKCB(코리아크레딧뷰로), NICE평가정보 등 신용정보회사\n\n" +
      "【조회 항목】\n성명, 주민등록번호, 주소, 연체 정보, 신용등급 및 점수\n\n" +
      "【이용 목적】\n서비스 가입 적격 여부 심사, 요금 후불제 적용 여부 판단, 이상 거래 탐지 및 부정 개통 방지\n\n" +
      "【조회 유효 기간】\n동의일로부터 3개월\n\n" +
      "동의를 거부할 권리가 있으나, 거부 시 서비스 가입이 불가할 수 있습니다.",
  },
  {
    id: "marketing",
    label: "마케팅 정보 수신 동의",
    required: false,
    detail:
      "LG유플러스㈜는 더 나은 혜택을 안내해 드리기 위해 마케팅 정보를 발송합니다.\n\n" +
      "【발송 내용】\nLG U+ 신규 서비스·요금제 출시 안내, 이벤트 및 프로모션, 맞춤형 혜택 및 쿠폰, 포인트·경품 당첨 안내\n\n" +
      "【수신 채널】\n문자(SMS/MMS), 이메일, 앱 푸시 알림, 전화\n\n" +
      "【보유 기간】\n동의 철회 시 또는 서비스 해지 시까지\n\n" +
      "동의하지 않아도 서비스 이용에 불이익이 없으며, 수신 동의 후에도 앱 또는 고객센터(101)를 통해 언제든지 철회할 수 있습니다.",
  },
];

interface TermsAgreementCardProps {
  onAgree?: (message: string) => void;
  // 이미 이 단계를 지나 다음 단계로 넘어간 경우 true. 지난 대화에 남아있는 카드를
  // 다시 조작해서 재제출하는 걸 막기 위해 체크박스/다음 버튼을 모두 잠금
  disabled?: boolean;
}

export function TermsAgreementCard({
  onAgree,
  disabled = false,
}: TermsAgreementCardProps) {
  // 새로고침해도 체크 상태가 유지되도록 sessionStorage에서 초기값을 복원함
  const [checked, setChecked] =
    useState<Record<string, boolean>>(readStoredChecked);
  const [sheetTerm, setSheetTerm] = useState<Term | null>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(CHECKED_STORAGE_KEY, JSON.stringify(checked));
    } catch {
      /* noop */
    }
  }, [checked]);

  const allRequired = TERMS.filter((t) => t.required);
  const allOptional = TERMS.filter((t) => !t.required);

  const allRequiredChecked = allRequired.every((t) => checked[t.id]);
  const allChecked = TERMS.every((t) => checked[t.id]);

  const toggleCheck = (id: string) => {
    if (disabled) return;
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = () => {
    if (disabled) return;
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
    if (disabled || !allRequiredChecked) return;
    const optionalAgreed = allOptional
      .filter((t) => checked[t.id])
      .map((t) => t.label);
    const message =
      optionalAgreed.length > 0
        ? `동의합니다 (선택 동의: ${optionalAgreed.join(", ")})`
        : "동의합니다";
    try {
      sessionStorage.removeItem(CHECKED_STORAGE_KEY);
    } catch {
      /* noop */
    }
    onAgree?.(message);
  };

  const TermRow = ({ term }: { term: Term }) => (
    <div className="flex items-center justify-between py-xs">
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
            <span className="text-text-tertiary ml-xs text-[10px]">(선택)</span>
          )}
        </span>
      </button>
      {term.detail && (
        <button
          type="button"
          onClick={() => setSheetTerm(term)}
          className="p-xs -mr-xs"
        >
          <ChevronRight size={13} className="text-text-tertiary shrink-0" />
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className="w-full rounded-[12px] rounded-tl-[4px] border border-border-default bg-surface p-lg flex flex-col gap-md shadow-sm">
        <div className="flex items-center justify-between">
          <strong className="font-sans text-caption-13-bold text-text-primary">
            약관 동의 안내
          </strong>
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

        <div className="flex flex-col gap-xs border-t border-border-default pt-sm">
          {allRequired.map((term) => (
            <TermRow key={term.id} term={term} />
          ))}
        </div>

        <div className="flex flex-col gap-xs border-t border-border-default pt-sm">
          {allOptional.map((term) => (
            <TermRow key={term.id} term={term} />
          ))}
        </div>

        <Button
          variant="inChat"
          className="w-full"
          onClick={handleAgree}
          disabled={disabled || !allRequiredChecked}
        >
          다음
        </Button>
      </div>

      {/* 약관 상세 바텀 시트 */}
      <Sheet
        open={sheetTerm !== null}
        onClose={() => setSheetTerm(null)}
        title={sheetTerm?.label}
      >
        <div className="px-xl pb-2xl pt-md flex flex-col gap-lg">
          <p className="font-sans text-body-14-regular text-text-secondary leading-relaxed">
            {sheetTerm?.detail}
          </p>
          <Button
            variant={
              sheetTerm && checked[sheetTerm.id] ? "secondary" : "primary"
            }
            className="w-full h-[48px]"
            onClick={() => {
              if (sheetTerm) toggleCheck(sheetTerm.id);
              setSheetTerm(null);
            }}
          >
            {sheetTerm && checked[sheetTerm.id] ? "동의 취소" : "동의하기"}
          </Button>
        </div>
      </Sheet>
    </>
  );
}
