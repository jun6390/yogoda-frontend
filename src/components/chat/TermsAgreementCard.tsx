"use client";

import { useState } from "react";
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
      "제1조 (목적)\n" +
      "이 약관은 LG유플러스㈜(이하 '회사')가 제공하는 이동통신 서비스(이하 '서비스')의 이용 조건 및 절차, 회사와 이용자의 권리·의무 및 책임 사항, 기타 필요한 사항을 규정함을 목적으로 합니다.\n\n" +
      "제2조 (약관의 효력 및 변경)\n" +
      "① 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.\n" +
      "② 회사는 관련 법령을 위배하지 않는 범위에서 이 약관을 변경할 수 있으며, 변경 시 적용일자 및 변경 사유를 명시하여 최소 7일 전(이용자에게 불리한 변경은 30일 전)부터 공지합니다.\n" +
      "③ 이용자가 변경된 약관에 동의하지 않는 경우, 이용계약을 해지할 수 있습니다.\n\n" +
      "제3조 (이용계약의 성립)\n" +
      "① 이용계약은 이용자가 본 약관 및 관련 정책에 동의하고, 회사가 정한 가입 신청 절차에 따라 신청한 내용을 회사가 승낙함으로써 성립합니다.\n" +
      "② 회사는 다음 각 호에 해당하는 경우 승낙을 유보하거나 거절할 수 있습니다.\n" +
      "  - 실명이 아니거나 타인의 명의를 이용한 경우\n" +
      "  - 허위 정보를 기재하거나 필수 정보를 기재하지 않은 경우\n" +
      "  - 이전에 서비스 이용계약이 해지된 이력이 있는 경우 (단, 해지 후 회사의 재가입 승낙을 얻은 경우는 예외)\n\n" +
      "제4조 (서비스의 제공 및 변경)\n" +
      "① 회사는 이용자에게 이동전화, 데이터, 문자메시지 등 이동통신 서비스를 제공합니다.\n" +
      "② 회사는 서비스의 품질 향상, 설비의 보수·점검, 국가비상사태, 정전, 서비스 설비의 장애 등 부득이한 사유가 있는 경우 서비스 제공을 일시 중지할 수 있으며, 이 경우 사전에 공지합니다. 다만 긴급한 경우 사후에 통지할 수 있습니다.\n\n" +
      "제5조 (이용요금 및 납부)\n" +
      "① 이용자는 가입한 요금제에 따른 월정액 및 부가 이용요금을 회사가 정한 납부일까지 납부하여야 합니다.\n" +
      "② 요금이 2개월 이상 연체될 경우 회사는 사전 통지 후 서비스 이용을 제한할 수 있습니다.\n" +
      "③ 요금에 관한 세부 사항은 별도의 요금제 안내 페이지 및 이용요금표에 따릅니다.\n\n" +
      "제6조 (계약 해지 및 서비스 제한)\n" +
      "① 이용자는 언제든지 마이페이지 또는 고객센터를 통해 이용계약의 해지를 신청할 수 있습니다.\n" +
      "② 회사는 이용자가 이 약관을 위반하거나 요금을 상당 기간 연체하는 경우 사전 통지 후 서비스 이용을 제한하거나 계약을 해지할 수 있습니다.\n\n" +
      "제7조 (손해배상 및 면책)\n" +
      "① 회사의 귀책 사유로 이용자에게 손해가 발생한 경우 관련 법령 및 회사의 손해배상 기준에 따라 배상합니다.\n" +
      "② 천재지변, 전쟁, 그 밖에 이에 준하는 불가항력으로 인한 서비스 중단에 대해서는 책임을 지지 않습니다.\n\n" +
      "제8조 (준거법 및 관할)\n" +
      "이 약관과 관련한 분쟁에는 대한민국 법을 적용하며, 관할 법원은 민사소송법에 따른 관할 법원으로 합니다.",
  },
  {
    id: "privacy",
    label: "개인정보 수집·이용 동의",
    required: true,
    detail:
      "LG유플러스㈜(이하 '회사')는 「개인정보 보호법」 등 관련 법령에 따라 아래와 같이 개인정보를 수집·이용합니다. 내용을 자세히 읽으신 후 동의 여부를 결정해 주시기 바랍니다.\n\n" +
      "1. 수집하는 개인정보 항목\n" +
      "  - 필수: 성명, 생년월일, 성별, 내/외국인 구분, 휴대폰 번호, 주소, 이메일\n" +
      "  - 결제 관련: 납부 계좌번호 또는 신용카드 정보\n" +
      "  - 서비스 이용 과정에서 자동 생성되는 정보: 접속 로그, 이용 기록, 기기 정보(단말기 모델명, OS 버전)\n\n" +
      "2. 개인정보의 수집 및 이용 목적\n" +
      "  - 본인 확인 및 서비스 신청·개통 처리\n" +
      "  - 요금 청구, 정산 및 수납\n" +
      "  - 서비스 부정 이용 방지 및 민원 처리\n" +
      "  - 신규 서비스 개발 및 서비스 품질 개선을 위한 통계·분석 (통계 작성 시 개인을 식별할 수 없는 형태로 처리)\n\n" +
      "3. 개인정보의 보유 및 이용 기간\n" +
      "  - 서비스 이용계약이 유지되는 기간 동안 보유하며, 계약 해지 시 지체 없이 파기합니다.\n" +
      "  - 다만 관계 법령에 따라 아래 정보는 명시된 기간 동안 보관합니다.\n" +
      "    · 통신비밀보호법: 통화 내역 등 통신사실확인자료 최대 12개월\n" +
      "    · 전자상거래법: 계약 또는 청약철회 등에 관한 기록 5년\n" +
      "    · 국세기본법: 세금계산서 등 거래에 관한 기록 5년\n\n" +
      "4. 동의 거부 권리 및 불이익\n" +
      "이용자는 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다. 다만, 필수 항목에 대한 동의를 거부하실 경우 서비스 가입 및 이용이 제한될 수 있습니다.",
  },
  {
    id: "credit",
    label: "신용정보 조회·이용 동의",
    required: true,
    detail:
      "LG유플러스㈜(이하 '회사')는 「신용정보의 이용 및 보호에 관한 법률」에 따라 이동통신 서비스 가입 심사를 위하여 아래와 같이 귀하의 신용정보를 조회·이용합니다.\n\n" +
      "1. 신용정보를 제공받는 기관\n" +
      "  - 코리아크레딧뷰로(KCB), NICE평가정보 등 신용정보집중기관 및 신용조회회사\n\n" +
      "2. 조회하는 신용정보의 내용\n" +
      "  - 성명, 생년월일, 연락처 등 식별정보\n" +
      "  - 연체, 대위변제, 대지급 등 신용거래 정보\n" +
      "  - 신용등급 및 신용평점\n\n" +
      "3. 신용정보 조회의 목적\n" +
      "  - 서비스 가입 적격 여부(부정 가입 방지 포함) 심사\n" +
      "  - 요금 후불제 적용 여부 판단 및 보증보험 가입 여부 결정\n" +
      "  - 명의도용 등 이상 거래 탐지 및 예방\n\n" +
      "4. 신용정보 조회 동의의 유효기간\n" +
      "  - 이 동의는 신청일로부터 3개월간 유효하며, 그 기간 내 심사 목적으로만 이용됩니다.\n\n" +
      "5. 동의 거부 권리 및 불이익\n" +
      "이용자는 신용정보 조회·이용에 관한 동의를 거부할 권리가 있습니다. 다만 동의를 거부할 경우, 가입 심사가 원활히 진행되지 않아 서비스 가입이 제한될 수 있습니다.",
  },
  {
    id: "marketing",
    label: "마케팅 정보 수신 동의",
    required: false,
    detail:
      "LG유플러스㈜(이하 '회사')는 이용자에게 보다 유익한 혜택과 정보를 안내해 드리기 위하여 아래와 같이 마케팅 목적의 개인정보 이용 및 광고성 정보 수신에 대한 동의를 받고자 합니다.\n\n" +
      "1. 발송하는 정보의 내용\n" +
      "  - 신규 요금제·서비스 출시 안내\n" +
      "  - 시즌별 이벤트, 프로모션 및 할인 혜택 안내\n" +
      "  - 이용자 맞춤형 혜택, 쿠폰 및 제휴 서비스 안내\n" +
      "  - 포인트 적립·소멸 및 경품 당첨 안내\n\n" +
      "2. 수신 채널\n" +
      "  - 문자메시지(SMS/MMS), 전자우편(E-mail), 앱 푸시 알림, 전화(텔레마케팅)\n\n" +
      "3. 보유 및 이용 기간\n" +
      "  - 동의일로부터 서비스 이용계약 해지 또는 동의 철회 시까지 보유·이용합니다.\n\n" +
      "4. 동의 거부 권리 및 철회 방법\n" +
      "이용자는 마케팅 정보 수신에 동의하지 않을 수 있으며, 동의하지 않아도 서비스 이용에는 어떠한 불이익도 없습니다. 동의 이후에도 마이페이지 또는 고객센터(전화 101)를 통해 언제든지 수신 동의를 철회할 수 있습니다.",
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

  const allRequired = TERMS.filter((t) => t.required);
  const allOptional = TERMS.filter((t) => !t.required);

  const allRequiredChecked = allRequired.every((t) => checked[t.id]);
  const allChecked = TERMS.every((t) => checked[t.id]);

  const persistChecked = (next: Record<string, boolean>) => {
    try {
      sessionStorage.setItem(CHECKED_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* noop */
    }
  };

  // sessionStorage 쓰기를 checked 변경에 반응하는 useEffect로 두면, 같은 단계의
  // 카드가 (백엔드 재전송 등으로) 하나 더 마운트될 때 그 카드의 초기 빈 상태로
  // 되돌아오는 마운트 이펙트가 방금 사용자가 체크해둔 값을 조용히 덮어써버림.
  // 그래서 실제 사용자 조작(toggleCheck/toggleAll)에서만 명시적으로 저장함
  const toggleCheck = (id: string) => {
    if (disabled) return;
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      persistChecked(next);
      return next;
    });
  };

  const toggleAll = () => {
    if (disabled) return;
    const next: Record<string, boolean> = allChecked
      ? {}
      : Object.fromEntries(TERMS.map((t) => [t.id, true]));
    persistChecked(next);
    setChecked(next);
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
    // 여기서 sessionStorage를 지우지 않음 — 다음 단계로 넘어간 뒤에도 지난
    // 카드가 새로고침 시 실제로 체크했던 항목 그대로 보여야 하기 때문. 채팅을
    // 나가거나 로그아웃하면 clearChatSessionStorage가 전체를 정리함
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
          <p className="font-sans text-body-14-regular text-text-secondary leading-relaxed whitespace-pre-line">
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
