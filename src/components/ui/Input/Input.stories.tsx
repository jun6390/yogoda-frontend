import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Input } from "./Input";

const meta = {
  title: "UI/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    placeholder: "메시지를 입력하세요",
  },
  decorators: [
    (Story) => (
      <div className="w-[350px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Focus: Story = {
  args: {
    autoFocus: true,
  },
};

export const Error: Story = {
  args: {
    error: true,
    placeholder: "입력 값을 확인해주세요",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
