"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { IdCard } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet/Sheet";
import { Button } from "@/components/ui/Button/Button";
import { Input } from "@/components/ui/Input/Input";
import { Toast } from "@/components/ui/Toast/Toast";

interface IdentityVerificationCardProps {
  onVerify?: (message: string, extraPayload?: Record<string, unknown>) => void;
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

// 완성형 한글 음절(가~힣)과 영문만 남김. 자모 낱자·숫자·기호 등은 제거함
function nameCharsOnly(value: string) {
  return value.replace(/[^가-힣a-zA-Z]/g, "");
}

// 010-1234-5678
function formatPhone(digits: string) {
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, digits.length - 4)}-${digits.slice(digits.length - 4)}`;
}

// 실제 문자는 보내지 않는 형식상 인증이라 코드도 클라이언트에서 임의 생성함
function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * 본인 확인 카드. 가입 플로우 identity_verification 단계에서 AI 말풍선 아래에 표시됨.
 * 이름·생년월일·휴대폰 번호는 채팅이 아니라 이 카드의 입력폼에만 적도록 해서
 * 개인정보가 채팅 로그에 남지 않게 함. 정보 입력과 인증번호 확인을 한 화면에서
 * 처리함(단계 분리 없음).
 */
export function IdentityVerificationCard({
  onVerify,
}: IdentityVerificationCardProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  // 한글 조합 중(IME composing)엔 필터링하면 조합이 끊기므로, 조합이 끝난
  // 뒤에만 한글 정자 필터를 적용함
  const [isNameComposing, setIsNameComposing] = useState(false);
  const [birth, setBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [sentCode, setSentCode] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const birthInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // 채팅 메시지 목록 컨테이너의 translate 유틸이 position:fixed의 containing
  // block을 바꿔버려서, 토스트는 document.body로 포탈해야 뷰포트 기준으로 뜸
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const [toastDragY, setToastDragY] = useState(0);
  const [isDraggingToast, setIsDraggingToast] = useState(false);
  const toastDragStartYRef = useRef<number | null>(null);
  const TOAST_DISMISS_THRESHOLD = -60;

  const dismissToast = () => {
    setToastMessage(null);
    setToastDragY(0);
  };

  // 3초 뒤 위로 슥 올라가며 자동으로 사라짐. 드래그 중이면 건드리지 않음
  useEffect(() => {
    if (!toastMessage || isDraggingToast) return;

    const timer = setTimeout(() => {
      setToastDragY(-120);
      setTimeout(dismissToast, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toastMessage, isDraggingToast]);

  const handleToastTouchStart = (e: React.TouchEvent) => {
    toastDragStartYRef.current = e.touches[0].clientY;
    setIsDraggingToast(true);
  };

  const handleToastTouchMove = (e: React.TouchEvent) => {
    if (toastDragStartYRef.current === null) return;
    const delta = e.touches[0].clientY - toastDragStartYRef.current;
    if (delta < 0) setToastDragY(delta);
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
    // message는 AI가 읽을 자연어 문맥용, identityVerification은 서버가 DB에
    // 구조화된 JSON으로 저장할 원본 값
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
      <div className="w-full rounded-md rounded-tl-xs border border-border-default bg-surface p-lg flex flex-col gap-sm shadow-sm">
        <div className="flex items-center gap-xs">
          <IdCard size={16} className="text-action-primary shrink-0" />
          <strong className="font-sans text-caption-13-bold text-text-primary">
            본인 확인
          </strong>
        </div>
        <p className="font-sans text-caption-12-medium break-keep text-text-secondary">
          가입을 진행하려면 본인 확인이 필요해요.
        </p>
        <Button
          variant="inChat"
          className="w-full"
          onClick={() => setOpen(true)}
        >
          본인 확인하기
        </Button>
      </div>

      {/* title 없이 제목만 담은 헤더를 직접 그림 */}
      <Sheet open={open} onClose={handleClose} ariaLabel="본인 확인">
        <div className="px-2xl pb-2xl flex flex-col">
          <div className="flex flex-col items-center pt-2xl pb-xs text-center">
            <strong className="font-sans text-title-18-bold text-text-primary">
              본인 확인
            </strong>
          </div>

          <p className="mb-2xl mt-lg text-center font-sans text-caption-13-regular leading-relaxed break-keep text-text-secondary">
            가입을 진행하려면 본인 확인이 필요해요.
            <br />
            입력하신 정보는 본인 확인 목적으로만 안전하게 사용돼요.
          </p>

          <div className="mb-2xl flex flex-col gap-xs">
            <span className="pl-xs font-sans text-caption-12-bold text-text-primary">
              본인 확인 정보
            </span>
            <div className="flex flex-col gap-md rounded-lg bg-surface-subtle p-lg">
              <div className="flex flex-col gap-xs">
                <label className="font-sans text-caption-12-medium text-text-secondary">
                  이름
                </label>
                <Input
                  value={name}
                  onChange={(e) =>
                    setName(
                      isNameComposing
                        ? e.target.value
                        : nameCharsOnly(e.target.value),
                    )
                  }
                  onCompositionStart={() => setIsNameComposing(true)}
                  onCompositionEnd={(e) => {
                    setIsNameComposing(false);
                    setName(nameCharsOnly(e.currentTarget.value));
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    birthInputRef.current?.focus();
                  }}
                  placeholder="홍길동"
                />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="font-sans text-caption-12-medium text-text-secondary">
                  생년월일 8자리
                </label>
                <Input
                  ref={birthInputRef}
                  value={birth}
                  onChange={(e) =>
                    setBirth(digitsOnly(e.target.value).slice(0, 8))
                  }
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    phoneInputRef.current?.focus();
                  }}
                  placeholder="19900101"
                  inputMode="numeric"
                />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="font-sans text-caption-12-medium text-text-secondary">
                  휴대폰 번호
                </label>
                <div className="flex items-center gap-sm">
                  <Input
                    ref={phoneInputRef}
                    value={phone}
                    onChange={(e) =>
                      setPhone(digitsOnly(e.target.value).slice(0, 11))
                    }
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      if (canSendCode) handleSendCode();
                    }}
                    placeholder="01012345678"
                    inputMode="numeric"
                    className="flex-1"
                  />
                  <Button
                    variant="inChatOutline"
                    className="h-13 shrink-0 whitespace-nowrap"
                    disabled={!canSendCode}
                    onClick={handleSendCode}
                  >
                    인증번호 전송
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-xs">
                <div className="flex items-center justify-between">
                  <label className="font-sans text-caption-12-medium text-text-secondary">
                    인증번호 6자리
                  </label>
                  {sentCode && (
                    <button
                      type="button"
                      onClick={handleSendCode}
                      className="font-sans text-micro-11-regular text-action-primary"
                    >
                      인증번호 다시 전송
                    </button>
                  )}
                </div>
                <Input
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(digitsOnly(e.target.value).slice(0, 6));
                    setCodeError(false);
                  }}
                  onFocus={() => {
                    // 실제 문자 발송이 없는 형식상 인증이라 포커스만으로 채워줌
                    if (sentCode) {
                      setInputCode(sentCode);
                      setCodeError(false);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    if (isCodeValid && sentCode) handleVerify();
                  }}
                  placeholder="123456"
                  inputMode="numeric"
                  error={codeError}
                  className="tracking-code"
                />
                {codeError && (
                  <span className="font-sans text-micro-11-regular text-error">
                    인증번호가 일치하지 않아요.
                  </span>
                )}
              </div>
            </div>
          </div>

          <Button
            variant="secondary"
            className="h-13 w-full"
            disabled={!isCodeValid || !sentCode}
            onClick={handleVerify}
          >
            인증 완료
          </Button>
        </div>
      </Sheet>

      {/* 위로 끌어서 치우기 전엔 자동으로 안 사라짐. document.body 포탈 이유는 위 mounted 주석 참고 */}
      {mounted &&
        toastMessage &&
        createPortal(
          // CSS 애니메이션(등장)과 인라인 transform(드래그)이 한 엘리먼트에서 충돌해 둘로 나눔
          <div className="fixed top-[calc(env(safe-area-inset-top)+var(--spacing-lg))] left-1/2 z-[100] motion-safe:animate-toast-drop-in">
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
