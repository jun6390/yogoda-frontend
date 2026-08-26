import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DateRangePicker } from "./DateRangePicker";

const meta = {
  title: "Admin/DateRangePicker",
  component: DateRangePicker,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof DateRangePicker>;

export default meta;

type Story = StoryObj;

function DateRangePickerExample() {
  const [range, setRange] = useState({ startDate: "", endDate: "" });

  return (
    <DateRangePicker
      startDate={range.startDate}
      endDate={range.endDate}
      onChange={setRange}
    />
  );
}

export const Default: Story = {
  render: () => <DateRangePickerExample />,
};
