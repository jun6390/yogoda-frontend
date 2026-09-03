import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { BrandLogo } from "./BrandLogo";

const meta = {
  title: "UI/BrandLogo",
  component: BrandLogo,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { brand: "배달의민족" },
} satisfies Meta<typeof BrandLogo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const UnknownBrand: Story = { args: { brand: "알 수 없는 매장" } };
export const AllBrands: Story = {
  render: () => (
    <div className="flex flex-wrap gap-md">
      {[
        "U+",
        "N Pay",
        "배달의민족",
        "CGV",
        "스타벅스",
        "올리브영",
        "GS25",
        "파리바게뜨",
        "배스킨라빈스",
      ].map((brand) => (
        <BrandLogo key={brand} brand={brand} />
      ))}
    </div>
  ),
};
