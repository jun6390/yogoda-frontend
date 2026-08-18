import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AITypingIndicator } from "./AITypingIndicator";

const meta = {
  title: "UI/AI Typing Indicator",
  component: AITypingIndicator,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    state: "typing",
  },
  argTypes: {
    state: {
      control: "select",
      options: ["typing", "error"],
    },
  },
} satisfies Meta<typeof AITypingIndicator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Typing: Story = {};

export const Error: Story = {
  args: {
    state: "error",
  },
};
