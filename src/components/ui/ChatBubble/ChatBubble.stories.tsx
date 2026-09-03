import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ChatMarkdown } from "../ChatMarkdown/ChatMarkdown";
import { AIChatBubble, UserChatBubble } from "./ChatBubble";

const meta = {
  title: "UI/ChatBubble",
  component: AIChatBubble,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { children: "현재 사용 패턴을 분석해볼게요." },
  decorators: [
    (Story) => (
      <div className="w-[390px] p-lg">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AIChatBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AI: Story = {};
export const User: Story = {
  render: () => (
    <UserChatBubble>데이터가 넉넉한 요금제를 찾아줘</UserChatBubble>
  ),
};
export const Markdown: Story = {
  render: () => (
    <AIChatBubble>
      <ChatMarkdown>
        {"## 추천 이유\n- **데이터 40GB** 제공\n- 월 요금 절약"}
      </ChatMarkdown>
    </AIChatBubble>
  ),
};
