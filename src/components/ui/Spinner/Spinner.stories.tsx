import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PageSpinner, Spinner } from "./Spinner";

const meta = {
  title: "UI/Spinner",
  component: Spinner,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { size: "md", label: "로딩 중" },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-xl text-action-primary">
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
    </div>
  ),
};
export const FullPage: Story = { render: () => <PageSpinner /> };
