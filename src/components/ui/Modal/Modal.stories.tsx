import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Modal } from "./Modal";

const meta = {
  title: "UI/Modal",
  component: Modal,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    heading: "무료 AI 상담을 모두 사용했어요",
    description:
      "비로그인 상태에서는 AI 상담을\n5회까지 이용할 수 있어요.\n로그인하면 상담을 계속하고\n추천 내역도 저장할 수 있어요.",
    primaryLabel: "로그인하고 계속하기",
    secondaryLabel: "나중에",
  },
  decorators: [
    (Story) => (
      <div className="bg-[#1f1f1f] p-2xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Modal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
