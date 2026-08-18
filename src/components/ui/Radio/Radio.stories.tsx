import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Radio } from "./Radio";

const meta = {
  title: "UI/Radio",
  component: Radio,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    name: "plan",
  },
} satisfies Meta<typeof Radio>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Unselected: Story = {};

export const Selected: Story = {
  args: {
    defaultChecked: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const WithLabel: Story = {
  args: {
    label: "5G 데이터 플러스",
  },
};
