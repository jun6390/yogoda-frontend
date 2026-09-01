"use client";

import { Button } from "@/components/ui/Button/Button";

interface ChatLogConsentBannerProps {
  onRespond: (consented: boolean) => void;
}

export function ChatLogConsentBanner({ onRespond }: ChatLogConsentBannerProps) {
  return (
    <div className="flex w-full flex-col gap-md rounded-md bg-surface-subtle p-md">
      <p className="font-sans text-caption-12-regular leading-relaxed text-text-secondary">
        안녕하세요! 상담 시작 전에 하나만 여쭤볼게요. 이 대화를 저희 팀이
        살펴보고 상담 품질을 개선하는 데 활용해도 될까요? 거부해도 상담엔 지장
        없어요.
      </p>
      <div className="flex items-center gap-sm">
        <Button
          variant="inChat"
          className="flex-1 border border-border-default py-xs text-caption-12-bold"
          onClick={() => onRespond(true)}
        >
          네, 좋아요
        </Button>
        <button
          type="button"
          onClick={() => onRespond(false)}
          className="flex-1 rounded-md border border-border-default bg-surface py-xs text-center font-sans text-caption-12-bold text-text-secondary hover:bg-surface-subtle"
        >
          동의 안 할게요
        </button>
      </div>
    </div>
  );
}
