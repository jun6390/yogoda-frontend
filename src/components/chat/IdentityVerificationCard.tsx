"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet/Sheet";
import { Button } from "@/components/ui/Button/Button";
import { Input } from "@/components/ui/Input/Input";

interface IdentityVerificationCardProps {
  onVerify?: (message: string) => void;
}

// 하이픈/공백 없이 숫자만 남김
function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

// 010-1234-5678 형태로 표시용 포맷
function formatPhone(digits: string) {
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, digits.length - 4)}-${digits.slice(digits.length - 4)}`;
}

/**
 * 휴대폰 본인인증 카드. 가입 플로우 identity_verification 단계에서 AI 말풍선
 * 아래에 표시됨. 실제 인증 문자는 발송하지 않는 형식상 인증(데모)으로, 휴대폰
 * 번호와 인증번호(아무 6자리)만 입력하면 통과함.
 */
export function IdentityVerificationCard({
  onVerify,
}: IdentityVerificationCardProps) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  const phoneDigits = digitsOnly(phone);
  const isPhoneValid = phoneDigits.length >= 10 && phoneDigits.length <= 11;
  const isCodeValid = /^\d{6}$/.test(code);
  const canSubmit = isPhoneValid && isCodeValid;

  const handleClose = () => {
    setOpen(false);
    setCode("");
  };

  const handleVerify = () => {
    if (!canSubmit) return;
    const formattedPhone = formatPhone(phoneDigits);
    setOpen(false);
    onVerify?.(`본인인증 완료 (휴대폰: ${formattedPhone})`);
  };

  return (
    <>
      <div className="w-full rounded-[12px] rounded-tl-[4px] border border-border-default bg-surface p-lg flex flex-col gap-sm shadow-sm">
        <div className="flex items-center gap-xs">
          <ShieldCheck size={16} className="text-action-primary shrink-0" />
          <strong className="font-sans text-caption-13-bold text-text-primary">
            휴대폰 본인인증
          </strong>
        </div>
        <p className="font-sans text-caption-12-medium text-text-secondary">
          가입을 진행하려면 본인인증이 필요해요.
        </p>
        <Button className="w-full" onClick={() => setOpen(true)}>
          본인인증하기
        </Button>
      </div>

      <Sheet open={open} onClose={handleClose} title="휴대폰 본인인증">
        <div className="px-xl pb-2xl pt-md flex flex-col gap-lg">
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
          <div className="flex flex-col gap-xs">
            <label className="font-sans text-caption-12-medium text-text-secondary">
              인증번호 6자리
            </label>
            <Input
              value={code}
              onChange={(e) => setCode(digitsOnly(e.target.value).slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
            />
          </div>
          <Button
            className="w-full h-[48px]"
            disabled={!canSubmit}
            onClick={handleVerify}
          >
            인증 완료
          </Button>
        </div>
      </Sheet>
    </>
  );
}
