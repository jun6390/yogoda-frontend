import type { Metadata } from "next";
import type { ReactNode } from "react";

import { notoSansKr } from "@/styles/fonts";
import { QueryProvider } from "@/providers/query-provider";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

import "../globals.css";

export const metadata: Metadata = {
  title: "요고다 - 관리자페이지",
};

interface AdminLayoutProps {
  children: ReactNode;
}

/*
 * 어드민은 다국어가 필요 없는 내부 도구라 [locale] 세그먼트 밖에 둠
 * app/layout.tsx가 없으므로 이 레이아웃이 어드민 트리의 Root Layout이 됨
 * (Next.js가 지원하는 "Root Layout 없이 하위 폴더마다 자체 Root Layout" 패턴)
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <html lang="ko">
      <body className={`${notoSansKr.variable} font-sans antialiased`}>
        <QueryProvider>
          <AdminGuard>
            <div className="flex h-dvh w-full flex-col overflow-hidden bg-background md:flex-row">
              <AdminSidebar />
              <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
          </AdminGuard>
        </QueryProvider>
      </body>
    </html>
  );
}
