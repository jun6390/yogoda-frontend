import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FavoriteIcon } from "./FavoriteIcon";

const meta = {
  title: "UI/FavoriteIcon",
  component: FavoriteIcon,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { selected: false },
} satisfies Meta<typeof FavoriteIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unselected: Story = {};
export const Selected: Story = { args: { selected: true } };
