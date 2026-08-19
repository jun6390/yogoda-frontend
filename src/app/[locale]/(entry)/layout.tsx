import type { ReactNode } from "react";

import { AppLayout } from "@/components/layout/AppLayout";

interface EntryLayoutProps {
  children: ReactNode;
}

export default function EntryLayout({ children }: EntryLayoutProps) {
  return <AppLayout>{children}</AppLayout>;
}
