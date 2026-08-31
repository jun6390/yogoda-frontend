"use client";

import { MessageCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";

/**
 * 채팅에서 요금제 페이지로 이동했을 때만 표시되는 플로팅 버튼.
 * ?from=chat 파라미터가 있을 때만 렌더링됨.
 */
export function BackToChatButton() {
  const searchParams = useSearchParams();
  if (searchParams.get("from") !== "chat") return null;

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
