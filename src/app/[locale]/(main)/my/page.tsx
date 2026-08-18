import { getTranslations } from "next-intl/server";

export default async function Page() {
  const t = await getTranslations("Pages");

  return <div>{t("my")}</div>;
}
