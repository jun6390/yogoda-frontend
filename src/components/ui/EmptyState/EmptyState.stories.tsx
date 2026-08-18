import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { EmptyState } from "./EmptyState";

const meta = {
  title: "UI/Empty State",
  component: EmptyState,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    heading: "아직 내용이 없어요",
    description: "새로운 항목이 생기면 이곳에서 확인할 수 있어요.",
  },
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
