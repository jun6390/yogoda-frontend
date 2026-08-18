import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProgressBar } from "./ProgressBar";

const meta = {
  title: "UI/Progress Bar",
  component: ProgressBar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    value: 60,
  },
} satisfies Meta<typeof ProgressBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Complete: Story = {
  args: {
    complete: true,
  },
};
