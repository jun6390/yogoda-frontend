import { getTranslations } from "next-intl/server";

import { PageContainer } from "@/components/layout/PageContainer";
import { PlanBrowseContent } from "@/components/plans/PlanBrowseContent";
import { PlanSubNav } from "@/components/plans/PlanSubNav";
import { BackToChatButton } from "@/components/chat/BackToChatButton";

export default async function PlansPage() {
  const t = await getTranslations("Plans");

  return (
    <>
      <PlanSubNav />

      <BackToChatButton />

      <PageContainer className="pb-2xl pt-lg">
        <section>
          <h1 className="font-sans text-title-24-bold text-text-primary">
            {t("titleLine1")}
            <br />
            {t("titleLine2")}
          </h1>

          <PlanBrowseContent />
        </section>
      </PageContainer>
    </>
  );
}
