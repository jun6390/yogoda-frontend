"use client";

import { MessageCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";

/**
 * 채팅에서 요금제 페이지로 이동했을 때만 표시되는 플로팅 버튼.
 * ?from=chat 파라미터가 있을 때만 렌더링됨.
 * 화면 상단 헤더 중앙에 떠 있고, 언제든 누를 수 있다는 걸 알리기 위해
 * 계속 살짝 통통 튀는 애니메이션이 붙어 있음.
 */
export function BackToChatButton() {
  const searchParams = useSearchParams();
  if (searchParams.get("from") !== "chat") return null;

  return (
    <div className="fixed top-4 left-1/2 z-30 -translate-x-1/2 pointer-events-none">
      <Link
        href="/ai"
        className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-action-primary px-3.5 py-2.5 shadow-lg text-text-on-primary font-sans text-[12px] font-bold leading-none motion-safe:animate-[ctaBounce_1.6s_ease-in-out_infinite]"
      >
        <MessageCircle size={14} aria-hidden="true" />
        채팅으로 돌아가기
      </Link>
    </div>
  );
}
