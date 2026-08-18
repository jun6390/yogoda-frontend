import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SectionHeader } from "./SectionHeader";

const meta = {
  title: "UI/Section Header",
  component: SectionHeader,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    children: "섹션 제목",
  },
  decorators: [
    (Story) => (
      <div className="w-[350px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SectionHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAction: Story = {
  args: {
    actionLabel: "전체 보기",
  },
};
