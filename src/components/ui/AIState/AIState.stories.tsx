import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AIState } from "./AIState";

const meta = {
  title: "UI/AI State",
  component: AIState,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    status: "thinking",
  },
  argTypes: {
    status: {
      control: "select",
      options: ["thinking", "streaming", "done", "error", "retry"],
    },
  },
} satisfies Meta<typeof AIState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Thinking: Story = {};

export const Streaming: Story = {
  args: {
    status: "streaming",
  },
};

export const Done: Story = {
  args: {
    status: "done",
  },
};

export const Error: Story = {
  args: {
    status: "error",
  },
};

export const Retry: Story = {
  args: {
    status: "retry",
  },
};
