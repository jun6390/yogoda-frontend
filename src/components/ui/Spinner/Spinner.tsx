import { cn } from "@/lib/utils";

type SpinnerSize = "sm" | "md" | "lg";

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  label?: string;
  // 기본 굵기(SIZE별 STROKE 값)를 이 화면에서만 다르게 쓰고 싶을 때
  strokeWidth?: number;
}

const SIZE: Record<SpinnerSize, string> = {
  sm: "size-4",
  md: "size-6",
  lg: "size-9",
};

const STROKE: Record<SpinnerSize, number> = {
  sm: 2.5,
  md: 2.5,
  lg: 3,
};

/**
 * SVG 기반 원형 스피너.
 * 색상은 currentColor를 따르므로 부모의 text-* 클래스로 제어한다.
 */
export function Spinner({
  size = "md",
  className,
  label = "로딩 중",
  strokeWidth,
}: SpinnerProps) {
  const stroke = strokeWidth ?? STROKE[size];
  const r = 50 - stroke / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <span
      role="status"
      aria-label={label}
      className={cn("inline-flex shrink-0", SIZE[size], className)}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-spin"
      >
        <circle
          cx="50"
          cy="50"
          r={r}
          stroke="currentColor"
          strokeWidth={stroke}
          className="opacity-20"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.75}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
      </svg>
    </span>
  );
}

/** 페이지 중앙에 배치하는 스피너 래퍼 */
export function PageSpinner({ label }: { label?: string }) {
  return (
    <div className="flex min-h-full items-center justify-center py-5xl">
      <Spinner size="lg" className="text-action-primary" label={label} />
    </div>
  );
}
