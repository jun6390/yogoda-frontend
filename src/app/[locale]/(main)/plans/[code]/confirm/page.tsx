import { redirect } from "next/navigation";

export default async function PlanJoinConfirmPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  redirect(`/${locale}/plans/${encodeURIComponent(code)}`);
}
