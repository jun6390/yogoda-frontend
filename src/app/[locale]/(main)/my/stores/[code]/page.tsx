"use client";

import { useParams } from "next/navigation";

import { StoreDetailContent } from "@/components/my/StoreDetailContent";

export default function StoreDetailPage() {
  const { code } = useParams<{ code: string }>();
  return <StoreDetailContent code={code} />;
}
