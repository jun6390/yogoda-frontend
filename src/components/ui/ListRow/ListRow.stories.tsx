import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ListRow } from "./ListRow";

const meta = {
  title: "UI/List Row",
  component: ListRow,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    children: "항목 이름",
  },
} satisfies Meta<typeof ListRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomTrailing: Story = {
  args: {
    children: "알림 설정",
    trailing: "켜짐",
  },
};
