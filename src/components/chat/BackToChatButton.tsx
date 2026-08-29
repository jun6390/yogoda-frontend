"use client";

import { MessageCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";

/**
 * 요금제 탐색 페이지 등에서 AI 채팅으로 돌아가는 플로팅 버튼.
 * 모바일 컨테이너(max-w-[446px]) 안 우상단에 고정 표시됨.
 */
export function BackToChatButton() {
  return (
    <div className="fixed top-[72px] left-1/2 z-30 w-full max-w-[446px] -translate-x-1/2 flex justify-end px-lg pointer-events-none">
      <Link
        href="/ai"
        className="pointer-events-auto flex items-center gap-[6px] rounded-full bg-action-primary px-[14px] py-[10px] shadow-lg text-text-on-primary font-sans text-[12px] font-bold leading-none hover:bg-action-primary-hover transition-colors"
      >
        <MessageCircle size={14} aria-hidden="true" />
        채팅으로 돌아가기
      </Link>
    </div>
  );
}
