"use client";

import { MessageCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { Link } from "@/i18n/navigation";

/**
 * 채팅에서 요금제 페이지로 이동했을 때만 표시되는 플로팅 버튼.
 * ?from=chat 파라미터가 있을 때만 렌더링됨.
 * 하단 고정 CTA와 같은 앱 너비 안에 배치하고 스크롤과 무관하게 위치를 유지함.
 */
export function BackToChatButton() {
  const searchParams = useSearchParams();
  if (searchParams.get("from") !== "chat") return null;

  return (
    <div className="pointer-events-none fixed bottom-56 left-1/2 z-30 flex w-full max-w-[446px] -translate-x-1/2 justify-end px-lg">
      <Link
        href="/ai"
        aria-label="채팅으로 돌아가기"
        className="pointer-events-auto flex size-12 items-center justify-center rounded-full bg-action-primary text-text-on-primary shadow-lg"
      >
        <MessageCircle size={22} aria-hidden="true" />
      </Link>
    </div>
  );
}
