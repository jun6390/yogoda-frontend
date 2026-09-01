"use client";

import { MessageCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { Link } from "@/i18n/navigation";

/**
 * 채팅에서 요금제 페이지로 이동했을 때만 표시되는 플로팅 버튼.
 * ?from=chat 파라미터가 있을 때만 렌더링됨.
 * 화면 우측 하단에 독립적으로 떠 있는 원형 버튼(FAB) — 하단 고정 CTA 패널 등
 * 다른 요소의 스크롤/표시 여부와 무관하게 항상 같은 자리에 보여야 하는
 * 요소라, 어떤 페이지에서도 페이지 흐름에 얽매이지 않고 그대로 붙여 씀
 */
export function BackToChatButton() {
  const searchParams = useSearchParams();
  if (searchParams.get("from") !== "chat") return null;

  return (
    <div className="fixed right-xs bottom-56 z-30 pointer-events-none">
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
