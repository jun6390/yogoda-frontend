interface AdminTypingIndicatorProps {
  message: string;
}

/*
 * 유저용 채팅의 AITypingIndicator와 같은 느낌(물결 애니메이션 말풍선)을 내되,
 * admin은 다국어가 필요 없어 next-intl provider가 없으므로 그 컴포넌트를 그대로
 * 못 씀. 필요한 시각 스타일만 이 파일에 가볍게 복제함
 */
export function AdminTypingIndicator({ message }: AdminTypingIndicatorProps) {
  return (
    <div className="flex items-center rounded-md rounded-tl-[4px] border border-border-default bg-surface px-lg py-md shadow-sm">
      <span className="font-sans text-caption-13-medium text-text-secondary">
        {message.split("").map((char, index) => (
          <span
            key={index}
            className="inline-block motion-safe:animate-[typingMessageWave_1.2s_ease-in-out_infinite]"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            {char === " " ? " " : char}
          </span>
        ))}
      </span>
    </div>
  );
}
