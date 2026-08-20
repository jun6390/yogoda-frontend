import { useCallback, useRef } from "react";

type AppendChars = (messageId: string, chars: string) => void;

/**
 * 청크가 한 번에 크게 오더라도 한 글자씩 흘러나오는 것처럼 보이게 하는 타자기 효과.
 * 메시지 id별로 대기 텍스트 큐 & 인터벌을 독립적으로 관리함
 * (지연 없이 실시간으로 응답받는 느낌을 주기 위함).
 */
export function useTypewriter(appendChars: AppendChars) {
  const pendingTextRef = useRef<Record<string, string>>({});
  const timerRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  // 특정 메시지의 타자기 효과를 중단하고 대기 큐를 비움
  const stop = useCallback((messageId: string) => {
    if (timerRef.current[messageId]) {
      clearInterval(timerRef.current[messageId]);
      delete timerRef.current[messageId];
    }
    delete pendingTextRef.current[messageId];
  }, []);

  const stopAll = useCallback(() => {
    Object.values(timerRef.current).forEach(clearInterval);
    timerRef.current = {};
    pendingTextRef.current = {};
  }, []);

  // 새로 도착한 청크를 대기 큐에 쌓고, 아직 실행 중이 아니면 재생 인터벌을 시작함
  const push = useCallback(
    (messageId: string, chunk: string) => {
      pendingTextRef.current[messageId] =
        (pendingTextRef.current[messageId] || "") + chunk;
      if (timerRef.current[messageId]) return; // 이미 실행 중

      timerRef.current[messageId] = setInterval(() => {
        const pending = pendingTextRef.current[messageId] || "";
        if (!pending) {
          clearInterval(timerRef.current[messageId]);
          delete timerRef.current[messageId];
          return;
        }

        // 밀린 양이 많으면 한 번에 더 많이 꺼내서 지연이 계속 쌓이지 않도록 함
        const revealCount = Math.max(1, Math.ceil(pending.length / 10));
        pendingTextRef.current[messageId] = pending.slice(revealCount);
        appendChars(messageId, pending.slice(0, revealCount));
      }, 20);
    },
    [appendChars],
  );

  return { push, stop, stopAll };
}
