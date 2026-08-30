"use client";

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Sheet } from "./Sheet";
import { Button } from "../Button/Button";

const meta = {
  title: "UI/Sheet",
  component: Sheet,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Sheet>;

export default meta;

type Story = StoryObj<typeof meta>;

function SheetDemo({
  title,
  children,
}: {
  title?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>시트 열기</Button>
      <Sheet open={open} onClose={() => setOpen(false)} title={title}>
        {children}
      </Sheet>
    </>
  );
}

export const Default: Story = {
  args: { open: false, onClose: () => {} },
  render: () => (
    <SheetDemo title="기본 시트">
      <div className="px-xl pb-xl pt-md flex flex-col gap-md">
        <p className="font-sans text-body-14-regular text-text-secondary">
          바텀 시트 콘텐츠 영역입니다. 원하는 내용을 자유롭게 넣을 수 있어요.
        </p>
        <Button className="w-full h-[48px]">확인</Button>
      </div>
    </SheetDemo>
  ),
};

export const NoTitle: Story = {
  args: { open: false, onClose: () => {} },
  render: () => (
    <SheetDemo>
      <div className="px-xl pb-xl pt-sm flex flex-col gap-md">
        <p className="font-sans text-body-14-regular text-text-secondary">
          타이틀 없는 시트입니다.
        </p>
        <Button className="w-full h-[48px]">확인</Button>
      </div>
    </SheetDemo>
  ),
};

export const LongContent: Story = {
  args: { open: false, onClose: () => {} },
  render: () => (
    <SheetDemo title="긴 콘텐츠">
      <div className="px-xl pb-xl pt-md flex flex-col gap-md">
        {Array.from({ length: 20 }, (_, i) => (
          <p
            key={i}
            className="font-sans text-body-14-regular text-text-secondary"
          >
            콘텐츠 항목 {i + 1}번입니다.
          </p>
        ))}
        <Button className="w-full h-[48px]">확인</Button>
      </div>
    </SheetDemo>
  ),
};
