"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RotateCcw, Send } from "lucide-react";

import { AdminTypingIndicator } from "@/components/admin/AdminTypingIndicator";
import { Select } from "@/components/admin/Select";
import { Badge } from "@/components/ui/Badge/Badge";
import {
  AIChatBubble,
  UserChatBubble,
} from "@/components/ui/ChatBubble/ChatBubble";
import { ChatMarkdown } from "@/components/ui/ChatMarkdown/ChatMarkdown";
import {
  usePromptTestConversation,
  type TestMessage,
} from "@/hooks/usePromptTestConversation";
import { getPromptDetail, getPromptHistory } from "@/lib/api/admin/prompt";
import { ADMIN_PROMPT_QUERY_KEYS } from "@/lib/admin/queryKeys";
import { cn } from "@/lib/utils";

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

// 비교 대상 드롭다운은 표 페이지네이션과 무관하게 전체 목록이 필요해서,
// 넉넉한 limit으로 별도 조회함 (버전이 100개를 넘어가면 오래된 것부터 안 보임)
function useVersionOptions() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ADMIN_PROMPT_QUERY_KEYS.history({ page: 1, limit: 100 }),
    queryFn: () => getPromptHistory({ page: 1, limit: 100 }),
  });

  return {
    options: (data?.versions ?? []).map((version) => ({
      value: version.versionId,
      label: `${version.version} · ${formatDate(version.deployedAt)}`,
    })),
    isPending,
    isError,
    refetch,
  };
}

function formatDate(iso: string) {
  const date = new Date(iso);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function useVersionContent(selectedValue: string, draftContent: string) {
  const isDraft = selectedValue === DRAFT_VALUE;

  const { data, isPending, isError } = useQuery({
    queryKey: ADMIN_PROMPT_QUERY_KEYS.detail(selectedValue),
    queryFn: () => getPromptDetail(selectedValue),
    enabled: !isDraft && Boolean(selectedValue),
  });

  if (isDraft) {
    return { content: draftContent, isPending: false, isError: false };
  }

  return { content: data?.content ?? "", isPending, isError };
}

function ChatColumn({
  label,
  messages,
  isTyping,
  isFinalizing,
  error,
}: {
  label: string;
  messages: TestMessage[];
  isTyping: boolean;
  isFinalizing: boolean;
  error: string | null;
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
              {message.text ? (
                <ChatMarkdown>{message.text}</ChatMarkdown>
              ) : (
                <span className="font-sans text-body-14-regular text-text-tertiary">
                  입력 중...
                </span>
              )}
            </AIChatBubble>
          ),
        )}

        {isTyping && isFinalizing && (
          <AIChatBubble noBackground>
            <AdminTypingIndicator message="정리하는 중..." />
          </AIChatBubble>
        )}
      </div>

      {error && (
        <p className="shrink-0 border-t border-border-default px-lg py-sm font-sans text-caption-12-regular text-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function PromptCompareChat({
  draftContent,
  draftVersionLabel,
}: PromptCompareChatProps) {
  const versionQuery = useVersionOptions();
  const versionOptions = versionQuery.options;

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

  const leftVersion = useVersionContent(leftValue, draftContent);
  const rightVersion = useVersionContent(rightValue, draftContent);
  const versionContentUnavailable =
    leftVersion.isPending ||
    rightVersion.isPending ||
    leftVersion.isError ||
    rightVersion.isError;

  const left = usePromptTestConversation(leftVersion.content);
  const right = usePromptTestConversation(rightVersion.content);
  const isTyping = left.isTyping || right.isTyping;
  const [input, setInput] = useState("");

  const selectOptions = [
    { value: DRAFT_VALUE, label: `${draftVersionLabel} (작성 중)` },
    ...versionOptions,
  ];

  const handleSend = (text: string) => {
    if (!text.trim() || isTyping || versionContentUnavailable) {
      return;
    }

    left.sendMessage(text);
    right.sendMessage(text);
    setInput("");
  };

  const handleReset = () => {
    left.reset();
    right.reset();
    setInput("");
  };

  return (
    <div className="flex h-full flex-col gap-md">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <div className="flex items-center gap-sm">
          <Badge variant="accent">버전 비교</Badge>
          <span className="font-sans text-caption-12-regular text-text-tertiary">
            같은 메시지를 두 버전에 동시에 보내서 답변을 비교해요
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
          triggerClassName="min-h-10 rounded-md"
        />
        <Select
          value={rightValue}
          options={selectOptions}
          ariaLabel="오른쪽 비교 버전"
          onChange={setRightValue}
          className="flex-1"
          triggerClassName="min-h-10 rounded-md"
        />
      </div>

      {versionQuery.isPending && (
        <p
          role="status"
          className="font-sans text-caption-12-regular text-text-secondary"
        >
          배포 버전 목록을 불러오는 중이에요...
        </p>
      )}
      {versionQuery.isError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-md rounded-md bg-error-soft px-md py-sm"
        >
          <p className="font-sans text-caption-12-regular text-error">
            배포 버전 목록을 불러오지 못했어요.
          </p>
          <button
            type="button"
            onClick={() => versionQuery.refetch()}
            className="shrink-0 font-sans text-caption-12-bold text-error"
          >
            다시 시도
          </button>
        </div>
      )}
      {(leftVersion.isError || rightVersion.isError) && (
        <p
          role="alert"
          className="rounded-md bg-error-soft px-md py-sm font-sans text-caption-12-regular text-error"
        >
          선택한 프롬프트 내용을 불러오지 못했어요. 버전을 다시 선택해 주세요.
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-md sm:flex-row">
        <ChatColumn
          label={
            selectOptions.find((option) => option.value === leftValue)?.label ??
            ""
          }
          messages={left.messages}
          isTyping={left.isTyping}
          isFinalizing={left.isFinalizing}
          error={left.error}
        />
        <ChatColumn
          label={
            selectOptions.find((option) => option.value === rightValue)
              ?.label ?? ""
          }
          messages={right.messages}
          isTyping={right.isTyping}
          isFinalizing={right.isFinalizing}
          error={right.error}
        />
      </div>

      <div className="flex flex-wrap gap-xs">
        {QUICK_TEST_MESSAGES.map((quickMessage) => (
          <button
            key={quickMessage}
            type="button"
            onClick={() => handleSend(quickMessage)}
            disabled={isTyping || versionContentUnavailable}
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
          handleSend(input);
        }}
        className="flex items-center gap-sm"
      >
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="두 버전 모두에 보낼 테스트 메시지를 입력하세요"
          disabled={isTyping || versionContentUnavailable}
          className="h-10 flex-1 rounded-md border border-border-default bg-surface px-md font-sans text-body-14-regular text-text-primary placeholder:text-text-tertiary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
        />
        <button
          type="submit"
          disabled={isTyping || versionContentUnavailable || !input.trim()}
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
