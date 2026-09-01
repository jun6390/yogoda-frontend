import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Select } from "./Select";

const meta = {
  title: "Admin/Select",
  component: Select,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj;

const STATUS_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "completed", label: "가입 완료" },
  { value: "dropped", label: "이탈" },
];

function SelectExample() {
  const [value, setValue] = useState("all");

  return (
    <Select
      value={value}
      options={STATUS_OPTIONS}
      ariaLabel="상태"
      onChange={setValue}
      className="w-35"
    />
  );
}

export const Default: Story = {
  render: () => <SelectExample />,
};
