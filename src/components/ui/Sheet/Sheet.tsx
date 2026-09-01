"use client";

import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

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
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [visible, setVisible] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      setDragY(0);
    } else {
      timerRef.current = setTimeout(() => setVisible(false), 300);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
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
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 시트 본체 */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title}
        style={{
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? "none" : "transform 0.3s ease-out",
        }}
        className={cn(
          "relative z-10 w-full max-w-[446px] rounded-t-2xl bg-surface shadow-xl",
          !isDragging && (open ? "translate-y-0" : "translate-y-full"),
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
