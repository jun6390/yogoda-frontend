import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ErrorState } from "./ErrorState";

const meta = {
  title: "UI/Error State",
  component: ErrorState,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    title: "정보를 불러오지 못했어요",
    description: "잠시 후 다시 시도해 주세요.",
    retryLabel: "다시 시도",
    onRetry: () => undefined,
    className: "w-[342px]",
  },
} satisfies Meta<typeof ErrorState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
