import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RotateCcw } from "lucide-react";

import { Modal } from "./Modal";

const meta = {
  title: "Admin/Modal",
  component: Modal,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    icon: <RotateCcw aria-hidden="true" size={20} />,
    heading: "v3 버전으로 되돌릴까요?",
    description: "지금 즉시 사용자 앱에 반영돼요.",
    primaryLabel: "되돌리기",
    secondaryLabel: "취소",
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

export const Loading: Story = {
  args: {
    primaryLoading: true,
  },
};
