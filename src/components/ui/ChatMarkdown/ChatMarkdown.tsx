import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMarkdownProps {
  children: string;
}

/**
 * AI 응답에 포함된 마크다운 서식(강조, 제목, 구분선, 목록, 표 등)을
 * 채팅 말풍선 안에서 앱 디자인 토큰에 맞게 렌더링함.
 * 부모(AIChatBubble)가 whitespace-pre-line을 쓰기 때문에, 마크다운 블록 요소들이
 * 줄바꿈까지 이중으로 반영되지 않도록 이 래퍼에서 whitespace를 다시 normal로 되돌림.
 */
export function ChatMarkdown({ children }: ChatMarkdownProps) {
  return (
    <div className="space-y-sm whitespace-normal break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <strong className="mt-xs block font-sans text-title-18-bold text-text-primary first:mt-0">
              {children}
            </strong>
          ),
          h2: ({ children }) => (
            <strong className="mt-xs block font-sans text-title-16-bold text-text-primary first:mt-0">
              {children}
            </strong>
          ),
          h3: ({ children }) => (
            <strong className="mt-xs block font-sans text-caption-13-bold text-text-primary first:mt-0">
              {children}
            </strong>
          ),
          p: ({ children }) => (
            <p className="font-sans text-body-14-regular text-text-primary">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-text-primary">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          hr: () => <hr className="my-sm border-t border-border-default" />,
          ul: ({ children }) => (
            <ul className="list-disc space-y-xs pl-lg font-sans text-body-14-regular text-text-primary">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-xs pl-lg font-sans text-body-14-regular text-text-primary">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-text-brand underline"
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded bg-surface-subtle px-xs py-[1px] font-mono text-micro-11-regular text-text-primary">
              {children}
            </code>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse font-sans text-caption-12-medium text-text-primary">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border-default bg-surface-subtle px-sm py-xs text-left font-sans text-caption-12-bold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border-default px-sm py-xs">
              {children}
            </td>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
