import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  MapFilterChips,
  MapViewToggle,
  type MapBrowseView,
} from "./MapBrowseControls";

const meta = {
  title: "UI/MapBrowseControls",
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const ViewToggle: Story = {
  render: () => <ViewToggleExample />,
};

export const FilterChips: Story = {
  render: () => <FilterChipsExample />,
};

function ViewToggleExample() {
  const [view, setView] = useState<MapBrowseView>("map");

  return (
    <div className="w-[350px]">
      <MapViewToggle
        value={view}
        onChange={setView}
        labels={{ map: "지도", list: "목록" }}
      />
    </div>
  );
}

function FilterChipsExample() {
  const [filter, setFilter] = useState("all");

  return (
    <div className="w-[350px]">
      <MapFilterChips
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "전체" },
          { value: "food", label: "외식" },
          { value: "culture", label: "문화" },
          { value: "shopping", label: "쇼핑" },
        ]}
      />
    </div>
  );
}
