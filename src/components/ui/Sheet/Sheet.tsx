"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/hooks/useHydrated";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  // 시트 자체 헤더 바 없이 내용 안에서 직접 제목을 그리는 경우, 접근성 라벨만
  // 따로 지정하기 위한 값. 생략하면 title을 그대로 씀
  ariaLabel?: string;
  children?: ReactNode;
  className?: string;
}

const DRAG_CLOSE_THRESHOLD = 80; // px — 이 이상 내리면 닫힘

/**
 * iOS 스타일 바텀 시트.
 * 드래그 핸들을 잡고 아래로 내리면 닫힘 (터치 & 마우스 지원).
 * X 버튼 없음 — 드래그 다운 또는 백드롭 탭으로 닫기.
 */
export function Sheet({
  open,
  onClose,
  title,
  ariaLabel,
  children,
  className,
}: SheetProps) {
  // SSR hydration 감지: 서버에선 false, 클라이언트에선 true
  const mounted = useHydrated();
  const [visible, setVisible] = useState(false);
  // 시트가 실제로 "열린 위치"에 있는지. open과 분리해두는 이유는 아래 참고
  const [entered, setEntered] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef<number | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /*
   * open이 true가 된 순간 바로 "열린 위치" 클래스로 그리면, 트랜지션이 재생될
   * '이전 프레임'이 없어서(마운트되자마자 이미 목표 위치) 슬라이드업 애니메이션이
   * 재생되지 않음. 그래서 먼저 "닫힌 위치"로 한 번 그린 뒤, 브라우저가 그 프레임을
   * 실제로 페인트한 다음 프레임에 entered를 켜서 열린 위치로 전환함 — 그래야
   * 트랜지션이 두 프레임 사이의 실제 변화로 인식되어 재생됨. rAF를 두 번 중첩한
   * 건, 한 번만 쓰면 같은 페인트에 묶여버릴 수 있어서 그 사이에 실제로 한 번
   * 페인트가 끝났음을 보장하기 위함(이 두 단계 마운트 패턴에서 흔히 쓰는 방식)
   */
  useEffect(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEntered(false);
      closeTimerRef.current = setTimeout(() => setVisible(false), 300);
      return () => {
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      };
    }

    setVisible(true);
    setDragY(0);

    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setEntered(true));
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // ── 드래그 핸들러 (터치) ────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current === null) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta > 0) setDragY(delta); // 위로는 안 당겨짐
  };

  const handleTouchEnd = () => {
    if (dragY >= DRAG_CLOSE_THRESHOLD) {
      onClose();
    } else {
      setDragY(0);
    }
    setIsDragging(false);
    startYRef.current = null;
  };

  // ── 드래그 핸들러 (마우스) ─────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    startYRef.current = e.clientY;
    setIsDragging(true);

    const onMouseMove = (ev: MouseEvent) => {
      if (startYRef.current === null) return;
      const delta = ev.clientY - startYRef.current;
      if (delta > 0) setDragY(delta);
    };
    const onMouseUp = () => {
      setDragY((prev) => {
        if (prev >= DRAG_CLOSE_THRESHOLD) {
          onClose();
          return 0;
        }
        return 0;
      });
      setIsDragging(false);
      startYRef.current = null;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  if (!mounted || !visible) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* 백드롭 */}
      <div
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity duration-300",
          entered ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 시트 본체. 드래그 중엔 손가락을 그대로 따라가야 해서 인라인 transform +
          트랜지션 없음. 드래그 중이 아닐 땐 인라인 스타일을 아예 안 줘서, 클래스의
          translate-y-0/full + transition-transform이 열림·닫힘·스프링백을 전부 처리함
          (인라인 style이 항상 클래스보다 우선하므로 드래그 중엔 자연히 클래스가 무시됨) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title}
        style={isDragging ? { transform: `translateY(${dragY}px)` } : undefined}
        className={cn(
          "relative z-10 w-full max-w-[446px] rounded-t-2xl bg-surface shadow-xl",
          !isDragging && "transition-transform duration-300 ease-out",
          !isDragging && (entered ? "translate-y-0" : "translate-y-full"),
          className,
        )}
      >
        {/* 드래그 핸들 — 터치/마우스로 잡아서 아래로 내리면 닫힘 */}
        <div
          className="flex justify-center pt-[10px] pb-[6px] cursor-grab active:cursor-grabbing select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <span className="h-[4px] w-[36px] rounded-full bg-border-strong/40" />
        </div>

        {/* 헤더 (타이틀만, X 버튼 없음) */}
        {title && (
          <div className="px-xl py-md border-b border-border-default">
            <span className="font-sans text-label-15-bold text-text-primary">
              {title}
            </span>
          </div>
        )}

        {/* 콘텐츠 */}
        <div className="overflow-y-auto max-h-[80dvh]">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
