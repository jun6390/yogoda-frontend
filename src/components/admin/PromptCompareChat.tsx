"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RotateCcw, Send } from "lucide-react";

import { Select } from "@/components/admin/Select";
import { Badge } from "@/components/ui/Badge/Badge";
import {
  AIChatBubble,
  UserChatBubble,
} from "@/components/ui/ChatBubble/ChatBubble";
import { ChatMarkdown } from "@/components/ui/ChatMarkdown/ChatMarkdown";
import { getPromptDetail, getPromptHistory } from "@/lib/api/admin/prompt";
import { ADMIN_PROMPT_QUERY_KEYS } from "@/lib/admin/queryKeys";
import { cn } from "@/lib/utils";

interface TestMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
}

interface PromptCompareChatProps {
  draftContent: string;
  draftVersionLabel: string;
}

const DRAFT_VALUE = "draft";

const QUICK_TEST_MESSAGES = [
  "데이터 많이 쓰는 편이에요",
  "넷플릭스 자주 봐요",
  "제일 저렴한 요금제 추천해줘",
  "가입은 어떻게 하나요?",
];

/*
 * "초안 프롬프트로 테스트"용 백엔드 엔드포인트가 아직 없어서, 두 버전이 실제로
 * 다르게 답하는 걸 흉내 내기 위한 목업 응답 풀. 실제 엔드포인트가 생기면
 * sendMessage 안의 setTimeout 블록만 API 호출로 교체하면 됨
 */
const MOCK_REPLY_POOLS: Record<"left" | "right", string[]> = {
  left: [
    "말씀해주신 사용 패턴을 보니 **데이터 무제한 요금제**가 잘 맞을 것 같아요. 평소 OTT도 자주 보시나요?",
    "네, 좋아요! 그럼 몇 가지 요금제를 비교해서 보여드릴게요.",
    "가입은 화면 하단의 **가입하기** 버튼을 누르시면 3분 안에 끝나요.",
  ],
  right: [
    "데이터 사용량을 여쭤봐도 될까요? 평균적으로 한 달에 얼마나 쓰시는지 알려주시면 더 정확히 추천해드릴 수 있어요.",
    "혹시 넷플릭스 외에 다른 OTT도 자주 보시나요? 결합 혜택이 있는 요금제도 있어요.",
    "**가입하기** 버튼으로 지금 바로 진행하실 수 있어요. 궁금한 점 더 있으신가요?",
  ],
};

// 비교 대상 드롭다운은 표 페이지네이션과 무관하게 전체 목록이 필요해서,
// 넉넉한 limit으로 별도 조회함 (버전이 100개를 넘어가면 오래된 것부터 안 보임)
function useVersionOptions() {
  const { data } = useQuery({
    queryKey: ADMIN_PROMPT_QUERY_KEYS.history({ page: 1, limit: 100 }),
    queryFn: () => getPromptHistory({ page: 1, limit: 100 }),
  });

  return (data?.versions ?? []).map((version) => ({
    value: version.versionId,
    label: `${version.version} · ${formatDate(version.deployedAt)}`,
  }));
}

function formatDate(iso: string) {
  const date = new Date(iso);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

/*
 * 실제 테스트 엔드포인트가 생기면, 드롭다운에서 고른 버전이 초안(DRAFT_VALUE)이
 * 아닐 때 이 훅으로 해당 버전의 content를 가져와 API 호출에 실어 보내면 됨
 */
function useVersionContent(selectedValue: string, draftContent: string) {
  const isDraft = selectedValue === DRAFT_VALUE;

  const { data, isPending } = useQuery({
    queryKey: ADMIN_PROMPT_QUERY_KEYS.detail(selectedValue),
    queryFn: () => getPromptDetail(selectedValue),
    enabled: !isDraft && Boolean(selectedValue),
  });

  if (isDraft) {
    return { content: draftContent, isPending: false };
  }

  return { content: data?.content ?? "", isPending };
}

function ChatColumn({
  label,
  messages,
  isTyping,
}: {
  label: string;
  messages: TestMessage[];
  isTyping: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col rounded-lg border border-border-default bg-background">
      <div className="shrink-0 border-b border-border-default px-lg py-md">
        <span className="font-sans text-caption-12-bold text-text-primary">
          {label}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-md overflow-y-auto p-lg">
        {messages.length === 0 && !isTyping && (
          <p className="font-sans text-caption-12-regular text-text-tertiary">
            아래에서 메시지를 보내면 이 버전의 응답이 여기 표시돼요.
          </p>
        )}

        {messages.map((message) =>
          message.sender === "user" ? (
            <UserChatBubble key={message.id}>{message.text}</UserChatBubble>
          ) : (
            <AIChatBubble key={message.id}>
              <ChatMarkdown>{message.text}</ChatMarkdown>
            </AIChatBubble>
          ),
        )}

        {isTyping && (
          <AIChatBubble>
            <span className="font-sans text-body-14-regular text-text-tertiary">
              입력 중...
            </span>
          </AIChatBubble>
        )}
      </div>
    </div>
  );
}

export function PromptCompareChat({
  draftContent,
  draftVersionLabel,
}: PromptCompareChatProps) {
  const versionOptions = useVersionOptions();

  const [leftValue, setLeftValue] = useState(DRAFT_VALUE);
  const [rightValue, setRightValue] = useState(DRAFT_VALUE);

  // 버전 목록은 비동기로 늦게 로드되므로, 로드되기 전엔 오른쪽도 초안으로 시작함
  // (왼쪽과 똑같은 걸 비교하는 것처럼 보임). 목록이 도착하면 그때 한 번만
  // 가장 최근 배포 버전으로 맞춰줌 (사용자가 이미 직접 고른 뒤엔 건드리지 않음)
  const [hasSyncedDefaultRight, setHasSyncedDefaultRight] = useState(false);
  if (
    !hasSyncedDefaultRight &&
    versionOptions.length > 0 &&
    rightValue === DRAFT_VALUE
  ) {
    setHasSyncedDefaultRight(true);
    setRightValue(versionOptions[0].value);
  }

  useVersionContent(leftValue, draftContent);
  useVersionContent(rightValue, draftContent);

  const [leftMessages, setLeftMessages] = useState<TestMessage[]>([]);
  const [rightMessages, setRightMessages] = useState<TestMessage[]>([]);
  const [leftReplyIndex, setLeftReplyIndex] = useState(0);
  const [rightReplyIndex, setRightReplyIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [input, setInput] = useState("");

  const selectOptions = [
    { value: DRAFT_VALUE, label: `${draftVersionLabel} (작성 중)` },
    ...versionOptions,
  ];

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) {
      return;
    }

    setLeftMessages((prev) => [
      ...prev,
      { id: `user-left-${Date.now()}`, sender: "user", text: trimmed },
    ]);
    setRightMessages((prev) => [
      ...prev,
      { id: `user-right-${Date.now()}`, sender: "user", text: trimmed },
    ]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      setLeftMessages((prev) => [
        ...prev,
        {
          id: `left-${Date.now()}`,
          sender: "ai",
          text: MOCK_REPLY_POOLS.left[
            leftReplyIndex % MOCK_REPLY_POOLS.left.length
          ],
        },
      ]);
      setRightMessages((prev) => [
        ...prev,
        {
          id: `right-${Date.now()}`,
          sender: "ai",
          text: MOCK_REPLY_POOLS.right[
            rightReplyIndex % MOCK_REPLY_POOLS.right.length
          ],
        },
      ]);
      setLeftReplyIndex((prev) => prev + 1);
      setRightReplyIndex((prev) => prev + 1);
      setIsTyping(false);
    }, 700);
  };

  const handleReset = () => {
    setLeftMessages([]);
    setRightMessages([]);
    setLeftReplyIndex(0);
    setRightReplyIndex(0);
    setInput("");
    setIsTyping(false);
  };

  return (
    <div className="flex h-full flex-col gap-md">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <div className="flex items-center gap-sm">
          <Badge variant="accent">버전 비교</Badge>
          <span className="font-sans text-caption-12-regular text-text-tertiary">
            같은 메시지를 두 버전에 동시에 보내서 답변을 비교해요 (목업 응답)
          </span>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="flex shrink-0 items-center gap-xs font-sans text-caption-12-bold text-text-secondary hover:text-text-primary"
        >
          <RotateCcw aria-hidden="true" size={14} />
          초기화
        </button>
      </div>

      <div className="flex flex-col gap-md sm:flex-row">
        <Select
          value={leftValue}
          options={selectOptions}
          ariaLabel="왼쪽 비교 버전"
          onChange={setLeftValue}
          className="flex-1"
          triggerClassName="min-h-[40px] rounded-md"
        />
        <Select
          value={rightValue}
          options={selectOptions}
          ariaLabel="오른쪽 비교 버전"
          onChange={setRightValue}
          className="flex-1"
          triggerClassName="min-h-[40px] rounded-md"
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-md sm:flex-row">
        <ChatColumn
          label={
            selectOptions.find((option) => option.value === leftValue)?.label ??
            ""
          }
          messages={leftMessages}
          isTyping={isTyping}
        />
        <ChatColumn
          label={
            selectOptions.find((option) => option.value === rightValue)
              ?.label ?? ""
          }
          messages={rightMessages}
          isTyping={isTyping}
        />
      </div>

      <div className="flex flex-wrap gap-xs">
        {QUICK_TEST_MESSAGES.map((quickMessage) => (
          <button
            key={quickMessage}
            type="button"
            onClick={() => sendMessage(quickMessage)}
            disabled={isTyping}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full border border-border-default px-md py-xs",
              "font-sans text-caption-12-bold text-text-secondary transition-colors hover:bg-surface-subtle",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {quickMessage}
          </button>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage(input);
        }}
        className="flex items-center gap-sm"
      >
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="두 버전 모두에 보낼 테스트 메시지를 입력하세요"
          disabled={isTyping}
          className="h-10 flex-1 rounded-md border border-border-default bg-surface px-md font-sans text-body-14-regular text-text-primary placeholder:text-text-tertiary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
        />
        <button
          type="submit"
          disabled={isTyping || !input.trim()}
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-md bg-action-primary text-text-on-primary transition-colors",
            "hover:bg-action-primary-hover",
            "disabled:cursor-not-allowed disabled:bg-border-default disabled:text-text-tertiary",
          )}
        >
          <Send aria-hidden="true" size={16} />
        </button>
      </form>
    </div>
  );
}
