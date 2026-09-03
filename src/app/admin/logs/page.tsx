import { Suspense } from "react";

import { SessionLogContent } from "@/components/admin/SessionLogContent";
import { PageSpinner } from "@/components/ui/Spinner/Spinner";

export default function AdminLogsPage() {
  return (
    <Suspense fallback={<PageSpinner label="세션 로그를 불러오는 중이에요." />}>
      <SessionLogContent />
    </Suspense>
  );
}
