import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MissionRow } from "./MissionRow";

const meta = {
  title: "UI/Mission Row",
  component: MissionRow,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    name: "미션 이름",
    point: "+50P",
  },
} satisfies Meta<typeof MissionRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Complete: Story = {
  args: {
    complete: true,
  },
};
