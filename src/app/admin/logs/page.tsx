import { Suspense } from "react";

import { SessionLogContent } from "@/components/admin/SessionLogContent";

export default function AdminLogsPage() {
  return (
    <Suspense>
      <SessionLogContent />
    </Suspense>
  );
}
