import { cn } from "@/lib/utils";

interface HighlightedTextProps {
  text: string;
  // 강조 구간에 적용할 클래스. 기본은 프라이머리 색 + 굵게
  highlightClassName?: string;
}

interface TextSegment {
  text: string;
  highlighted: boolean;
}

// AI가 "**...**"로 감싸 보내는, 핵심 구절만 뽑아내기 위한 파싱.
// split의 캡처 그룹 특성상 짝수 인덱스는 일반 텍스트, 홀수 인덱스는 강조 대상 텍스트가 됨
function parseHighlightedSegments(text: string): TextSegment[] {
  return text
    .split(/\*\*(.+?)\*\*/g)
    .map((segment, i) => ({ text: segment, highlighted: i % 2 === 1 }))
    .filter((segment) => segment.text !== "");
}

/**
 * AI가 마크다운 굵게(**텍스트**)로 감싸 보내주는 핵심 구절만 강조색으로 표시함.
 * 요금제 추천 이유, 비교 결과 요약 등 AI가 생성한 한두 문장짜리 텍스트에서
 * 사용자가 특히 눈여겨봐야 할 부분만 짚어주는 용도.
 */
export function HighlightedText({
  text,
  highlightClassName,
}: HighlightedTextProps) {
  const segments = parseHighlightedSegments(text);

  return (
    <>
      {segments.map((segment, i) =>
        segment.highlighted ? (
          <span
            key={i}
            className={cn("font-bold text-action-primary", highlightClassName)}
          >
            {segment.text}
          </span>
        ) : (
          <span key={i}>{segment.text}</span>
        ),
      )}
    </>
  );
}
