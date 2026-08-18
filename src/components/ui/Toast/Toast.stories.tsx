import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Toast } from "./Toast";

const meta = {
  title: "UI/Toast",
  component: Toast,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    message: "저장한 혜택에 추가했어요",
    actionLabel: "보러가기",
  },
  decorators: [
    (Story) => (
      <div className="bg-[#1f1f1f] p-2xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Toast>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutAction: Story = {
  args: {
    actionLabel: null,
  },
};
