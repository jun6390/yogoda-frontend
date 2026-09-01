"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Check, IdCard, ShieldCheck } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet/Sheet";
import { Button } from "@/components/ui/Button/Button";
import { Input } from "@/components/ui/Input/Input";
import { Toast } from "@/components/ui/Toast/Toast";

interface IdentityVerificationCardProps {
  onVerify?: (message: string, extraPayload?: Record<string, unknown>) => void;
}

// 숫자만 남김 (하이픈/공백 제거)
function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

// 010-1234-5678 형태로 표시용 포맷
function formatPhone(digits: string) {
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, digits.length - 4)}-${digits.slice(digits.length - 4)}`;
}

// 19900101 → 1990.01.01 (인증번호 입력 단계에서 확정된 정보를 보여줄 때만 씀)
function formatBirth(digits: string) {
  if (digits.length !== 8) return digits;
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`;
}

// 인증번호 6자리를 임의로 생성함 (형식상 인증 — 실제 문자는 발송하지 않고 토스트로 안내)
function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// 인증번호 입력 단계에서, 앞서 입력한 정보를 체크 표시와 함께 확정된 값으로 보여줌
function IdentityInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-md">
      <div className="flex flex-col gap-xs">
        <span className="font-sans text-micro-11-regular text-text-tertiary">
          {label}
        </span>
        <span className="font-sans text-label-14-bold text-text-primary">
          {value}
        </span>
      </div>
      <Check size={18} className="shrink-0 text-success" />
    </div>
  );
}

/**
 * 본인 확인 카드. 가입 플로우 identity_verification 단계에서 AI 말풍선 아래에
 * 표시됨. 채팅으로 이름·생년월일·휴대폰 번호를 묻지 않고, 이 카드의 입력폼에만
 * 적도록 해서 개인정보가 채팅 로그에 그대로 남지 않게 함.
 * "인증번호 받기"를 누르면 6자리 코드를 임의로 만들어 토스트로 보여주고(형식상
 * 인증 — 실제 문자는 발송하지 않음), 그 코드를 그대로 입력해야 다음 단계로
 * 넘어감. 세 값 모두 검증되면 백엔드가 유저 정보에 즉시 저장함.
 */
export function IdentityVerificationCard({
  onVerify,
}: IdentityVerificationCardProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [sentCode, setSentCode] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // SSR hydration 감지 (Sheet와 동일한 패턴): 서버에선 false, 클라이언트에선 true.
  // 채팅 메시지 목록 컨테이너에 항상 걸려있는 translate 유틸(페이드 애니메이션용)이
  // position:fixed의 containing block을 그 컨테이너로 바꿔버려서, 토스트를 그
  // 트리 안에 그대로 두면 좌표가 뒤틀리거나 overflow-y-auto에 잘려 안 보임.
  // document.body로 포탈해서 진짜 뷰포트 기준 fixed가 되게 함
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // 인증번호 토스트는 자동으로 사라지지 않고, 사용자가 위로 끌어서 치워야만 닫힘
  // (Sheet의 드래그로 닫기와 같은 방식이되, 화면 위쪽에 뜨는 토스트라 방향만 반대)
  const [toastDragY, setToastDragY] = useState(0);
  const [isDraggingToast, setIsDraggingToast] = useState(false);
  const toastDragStartYRef = useRef<number | null>(null);
  const TOAST_DISMISS_THRESHOLD = -60; // 이만큼 위로 끌면 닫힘

  const dismissToast = () => {
    setToastMessage(null);
    setToastDragY(0);
  };

  const handleToastTouchStart = (e: React.TouchEvent) => {
    toastDragStartYRef.current = e.touches[0].clientY;
    setIsDraggingToast(true);
  };

  const handleToastTouchMove = (e: React.TouchEvent) => {
    if (toastDragStartYRef.current === null) return;
    const delta = e.touches[0].clientY - toastDragStartYRef.current;
    if (delta < 0) setToastDragY(delta); // 아래로는 안 끌림
  };

  const handleToastTouchEnd = () => {
    if (toastDragY <= TOAST_DISMISS_THRESHOLD) {
      dismissToast();
    } else {
      setToastDragY(0);
    }
    setIsDraggingToast(false);
    toastDragStartYRef.current = null;
  };

  const handleToastMouseDown = (e: React.MouseEvent) => {
    toastDragStartYRef.current = e.clientY;
    setIsDraggingToast(true);

    const onMouseMove = (ev: MouseEvent) => {
      if (toastDragStartYRef.current === null) return;
      const delta = ev.clientY - toastDragStartYRef.current;
      if (delta < 0) setToastDragY(delta);
    };
    const onMouseUp = () => {
      setToastDragY((prev) => {
        if (prev <= TOAST_DISMISS_THRESHOLD) {
          dismissToast();
          return 0;
        }
        return 0;
      });
      setIsDraggingToast(false);
      toastDragStartYRef.current = null;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const isNameValid = name.trim().length >= 2;
  const isBirthValid = birth.length === 8;
  const isPhoneValid = phone.length >= 10 && phone.length <= 11;
  const canSendCode = isNameValid && isBirthValid && isPhoneValid;
  const isCodeValid = inputCode.length === 6;

  const handleClose = () => {
    setOpen(false);
    setSentCode(null);
    setInputCode("");
    setCodeError(false);
  };

  const handleSendCode = () => {
    if (!canSendCode) return;
    const code = generateVerificationCode();
    setSentCode(code);
    setInputCode("");
    setCodeError(false);
    setToastDragY(0);
    setToastMessage(`인증번호 [${code}]가 도착했어요`);
  };

  const handleVerify = () => {
    if (!sentCode || !isCodeValid) return;
    if (inputCode !== sentCode) {
      setCodeError(true);
      return;
    }
    const trimmedName = name.trim();
    const formattedPhone = formatPhone(phone);
    // AI가 읽을 자연어 문장은 그대로 보내되(문맥 파악용), 원본 값은 extraPayload로
    // 따로 넘겨서 서버가 DB에 자연어 대신 구조화된 JSON을 저장하게 함
    const message = `본인인증 완료 (이름: ${trimmedName}, 생년월일: ${birth}, 휴대폰: ${formattedPhone})`;
    setOpen(false);
    onVerify?.(message, {
      identityVerification: {
        name: trimmedName,
        birth,
        phoneNumber: formattedPhone,
      },
    });
  };

  return (
    <>
      <div className="w-full rounded-[12px] rounded-tl-[4px] border border-border-default bg-surface p-lg flex flex-col gap-sm shadow-sm">
        <div className="flex items-center gap-xs">
          <IdCard size={16} className="text-action-primary shrink-0" />
          <strong className="font-sans text-caption-13-bold text-text-primary">
            본인 확인
          </strong>
        </div>
        <p className="font-sans text-caption-12-medium text-text-secondary">
          가입을 진행하려면 이름·생년월일·휴대폰 번호 확인이 필요해요.
        </p>
        <Button
          variant="inChat"
          className="w-full"
          onClick={() => setOpen(true)}
        >
          본인 확인하기
        </Button>
      </div>

      {/* title을 안 넘겨서 Sheet 기본 헤더(단순 텍스트바)는 생략하고, 아이콘
          배지+타이틀+진행 단계를 담은 헤더를 직접 그림 */}
      <Sheet open={open} onClose={handleClose} ariaLabel="본인 확인">
        <div className="px-2xl pb-2xl flex flex-col">
          {/* 헤더: 아이콘 배지 + 타이틀 + 진행 단계 */}
          <div className="flex flex-col items-center gap-md pt-xs pb-xs text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-brand-soft">
              <ShieldCheck size={26} className="text-action-primary" />
            </div>
            <div className="flex flex-col gap-xs">
              <strong className="font-sans text-title-18-bold text-text-primary">
                본인 확인
              </strong>
              <span className="font-sans text-caption-12-medium text-text-tertiary">
                {sentCode === null
                  ? "1 / 2단계 · 정보 입력"
                  : "2 / 2단계 · 인증번호 확인"}
              </span>
            </div>
          </div>

          {/* 진행 표시 점 두 개. PlanRecommendationCards 캐러셀 인디케이터와 같은
              토큰(size-xs 기본 + 활성 항목만 w-md)을 그대로 씀 */}
          <div className="flex items-center justify-center gap-xs py-lg">
            <span
              className={`block size-xs rounded-full transition-all duration-300 ${
                sentCode === null
                  ? "bg-action-primary w-md"
                  : "bg-border-strong"
              }`}
            />
            <span
              className={`block size-xs rounded-full transition-all duration-300 ${
                sentCode !== null
                  ? "bg-action-primary w-md"
                  : "bg-border-strong"
              }`}
            />
          </div>

          {sentCode === null && (
            <p className="mb-2xl text-center font-sans text-caption-13-regular leading-relaxed text-text-secondary">
              가입을 진행하려면 실명·생년월일·휴대폰 번호 확인이 필요해요.
              <br />
              입력하신 정보는 본인 확인 목적으로만 안전하게 사용돼요.
            </p>
          )}

          {/* 입력 정보 카드 */}
          <div className="mb-2xl flex flex-col gap-xs">
            <span className="pl-xs font-sans text-caption-12-bold text-text-primary">
              본인 확인 정보
            </span>
            <div className="flex flex-col gap-lg rounded-lg bg-surface-subtle p-lg">
              {sentCode === null ? (
                <>
                  <div className="flex flex-col gap-xs">
                    <label className="font-sans text-caption-12-medium text-text-secondary">
                      이름
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="홍길동"
                    />
                  </div>
                  <div className="flex flex-col gap-xs">
                    <label className="font-sans text-caption-12-medium text-text-secondary">
                      생년월일 8자리
                    </label>
                    <Input
                      value={birth}
                      onChange={(e) =>
                        setBirth(digitsOnly(e.target.value).slice(0, 8))
                      }
                      placeholder="19900101"
                      inputMode="numeric"
                    />
                  </div>
                  <div className="flex flex-col gap-xs">
                    <label className="font-sans text-caption-12-medium text-text-secondary">
                      휴대폰 번호
                    </label>
                    <Input
                      value={phone}
                      onChange={(e) =>
                        setPhone(digitsOnly(e.target.value).slice(0, 11))
                      }
                      placeholder="01012345678"
                      inputMode="numeric"
                    />
                  </div>
                </>
              ) : (
                // 인증번호 단계에서는 입력폼 대신, 확정된 정보를 체크 표시와 함께
                // 읽기 전용으로 보여줌 (다시 수정하려면 시트를 닫고 새로 시작)
                <>
                  <IdentityInfoRow label="이름" value={name.trim()} />
                  <div className="h-px bg-border-default" />
                  <IdentityInfoRow
                    label="생년월일"
                    value={formatBirth(birth)}
                  />
                  <div className="h-px bg-border-default" />
                  <IdentityInfoRow
                    label="휴대폰 번호"
                    value={formatPhone(phone)}
                  />
                </>
              )}
            </div>
          </div>

          {sentCode === null ? (
            <Button
              className="h-[52px] w-full"
              disabled={!canSendCode}
              onClick={handleSendCode}
            >
              인증번호 받기
            </Button>
          ) : (
            <>
              {/* 전송 완료 배너. 실제로 뜨는 토스트와 이어지는 안내임 */}
              <div className="mb-xl flex items-center gap-sm rounded-lg bg-success-soft px-lg py-md">
                <Check size={16} className="shrink-0 text-success" />
                <span className="font-sans text-caption-12-medium text-success">
                  인증번호를 보내드렸어요. 화면 상단 알림을 확인해주세요.
                </span>
              </div>

              <div className="mb-2xl flex flex-col gap-xs">
                <div className="flex items-center justify-between">
                  <label className="font-sans text-caption-12-medium text-text-secondary">
                    인증번호 6자리
                  </label>
                  <button
                    type="button"
                    onClick={handleSendCode}
                    className="font-sans text-[11px] text-action-primary"
                  >
                    인증번호 다시 받기
                  </button>
                </div>
                <Input
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(digitsOnly(e.target.value).slice(0, 6));
                    setCodeError(false);
                  }}
                  placeholder="123456"
                  inputMode="numeric"
                  error={codeError}
                  className="tracking-[4px]"
                />
                {codeError && (
                  <span className="font-sans text-[11px] text-error">
                    인증번호가 일치하지 않아요.
                  </span>
                )}
              </div>

              <Button
                className="h-[52px] w-full"
                disabled={!isCodeValid}
                onClick={handleVerify}
              >
                인증 완료
              </Button>
            </>
          )}
        </div>
      </Sheet>

      {/* 인증번호 발송 토스트. 화면 위쪽에 뜨고, 위로 끌어서 치우기 전엔 자동으로
          사라지지 않음. 채팅 메시지 목록에 걸린 translate 유틸 때문에 이 트리 안에서는
          position:fixed가 뷰포트 기준으로 안 잡혀서, document.body로 포탈함 */}
      {mounted &&
        toastMessage &&
        createPortal(
          // 바깥 div는 등장 애니메이션 전용(고정 위치 + keyframes), 안쪽 div는 드래그로
          // 닫기 전용(가로 중앙 정렬 + 드래그 오프셋을 인라인 transform으로 직접 제어).
          // 하나의 엘리먼트에서 CSS 애니메이션과 인라인 transform을 같이 쓰면 서로
          // 충돌해서 둘로 나눔
          <div className="fixed top-4 left-1/2 z-[70] motion-safe:animate-[toastDropIn_0.3s_ease-out]">
            <div
              onTouchStart={handleToastTouchStart}
              onTouchMove={handleToastTouchMove}
              onTouchEnd={handleToastTouchEnd}
              onMouseDown={handleToastMouseDown}
              style={{
                transform: `translate(-50%, ${toastDragY}px)`,
                transition: isDraggingToast
                  ? "none"
                  : "transform 0.3s ease-out",
              }}
              className="cursor-grab touch-none select-none active:cursor-grabbing"
            >
              <Toast message={toastMessage} actionLabel={null} />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
