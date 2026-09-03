import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMarkdownProps {
  children: string;
}

// 보이지 않을 정도로 얇은 공백(Zs 카테고리라 CommonMark의 "공백"으로 인정됨)
const HAIR_SPACE = " ";

/*
 * CommonMark 규칙상, 닫는 **의 바로 앞이 문장부호(예: 괄호 ")")이고 바로 뒤가 공백
 * 없이 곧장 다른 글자로 이어지면 그 **는 강조 종료로 인정되지 않고 글자 그대로
 * 보임(flanking 규칙). 한국어는 조사가 띄어쓰기 없이 명사에 바로 붙는 게 정상이라
 * "**콘텐츠(OTT)**가 있나요"처럼 이 패턴이 자주 나옴. 닫는 ** 뒤에 안 보이는
 * hair space를 끼워 넣어 "공백 뒤에 이어짐" 조건을 만족시켜서 우회함
 */
function fixAmbiguousBoldClose(text: string): string {
  return text.replace(/(\p{P})(\*\*)(?=[\p{L}\p{N}])/gu, `$1$2${HAIR_SPACE}`);
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
            <strong className="mt-md block font-sans text-title-18-bold text-text-primary first:mt-0">
              {children}
            </strong>
          ),
          h2: ({ children }) => (
            <strong className="mt-md block font-sans text-title-16-bold text-text-primary first:mt-0">
              {children}
            </strong>
          ),
          h3: ({ children }) => (
            <strong className="mt-sm block font-sans text-caption-13-bold text-text-primary first:mt-0">
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
          hr: () => <hr className="my-md border-t border-border-default" />,
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
            <code className="rounded bg-surface-subtle px-xs py-px font-mono text-micro-11-regular text-text-primary">
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
        {fixAmbiguousBoldClose(children)}
      </ReactMarkdown>
    </div>
  );
}
