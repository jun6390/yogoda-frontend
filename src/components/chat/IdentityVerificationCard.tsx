"use client";

import { useEffect, useState } from "react";
import { IdCard } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet/Sheet";
import { Button } from "@/components/ui/Button/Button";
import { Input } from "@/components/ui/Input/Input";
import { Toast } from "@/components/ui/Toast/Toast";

interface IdentityVerificationCardProps {
  onVerify?: (message: string) => void;
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

// 인증번호 6자리를 임의로 생성함 (형식상 인증 — 실제 문자는 발송하지 않고 토스트로 안내)
function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
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

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

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
    setToastMessage(`인증번호 [${code}]가 도착했어요`);
  };

  const handleVerify = () => {
    if (!sentCode || !isCodeValid) return;
    if (inputCode !== sentCode) {
      setCodeError(true);
      return;
    }
    const message = `본인인증 완료 (이름: ${name.trim()}, 생년월일: ${birth}, 휴대폰: ${formatPhone(phone)})`;
    setOpen(false);
    onVerify?.(message);
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
        <Button className="w-full" onClick={() => setOpen(true)}>
          본인 확인하기
        </Button>
      </div>

      <Sheet open={open} onClose={handleClose} title="본인 확인">
        <div className="px-xl pb-2xl pt-md flex flex-col gap-lg">
          <div className="flex flex-col gap-xs">
            <label className="font-sans text-caption-12-medium text-text-secondary">
              이름
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              disabled={sentCode !== null}
            />
          </div>
          <div className="flex flex-col gap-xs">
            <label className="font-sans text-caption-12-medium text-text-secondary">
              생년월일 8자리
            </label>
            <Input
              value={birth}
              onChange={(e) => setBirth(digitsOnly(e.target.value).slice(0, 8))}
              placeholder="19900101"
              inputMode="numeric"
              disabled={sentCode !== null}
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
              disabled={sentCode !== null}
            />
          </div>

          {sentCode === null ? (
            <Button
              className="w-full h-[48px]"
              disabled={!canSendCode}
              onClick={handleSendCode}
            >
              인증번호 받기
            </Button>
          ) : (
            <div className="flex flex-col gap-xs">
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
              />
              {codeError && (
                <span className="font-sans text-[11px] text-error">
                  인증번호가 일치하지 않아요.
                </span>
              )}
              <Button
                className="w-full h-[48px]"
                disabled={!isCodeValid}
                onClick={handleVerify}
              >
                인증 완료
              </Button>
            </div>
          )}
        </div>
      </Sheet>

      {/* 인증번호 발송 토스트. Sheet 내부(transform 적용된 컨테이너) 밖에서 렌더링해야
          position: fixed 기준이 화면 전체가 됨 */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          actionLabel={null}
          className="fixed bottom-[88px] left-1/2 z-[70] -translate-x-1/2"
        />
      )}
    </>
  );
}
