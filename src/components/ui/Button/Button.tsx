import { useTranslations } from "next-intl";
import { ButtonBase, type ButtonBaseProps } from "./ButtonBase";

export function Button(props: Omit<ButtonBaseProps, "loadingLabel">) {
  const t = useTranslations("Common");
  return <ButtonBase {...props} loadingLabel={t("loading")} />;
}
