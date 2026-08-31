import { notFound } from "next/navigation";

import { UsageDemoContent } from "@/components/my/UsageDemoContent";

export default function UsageDemoPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <UsageDemoContent />;
}
