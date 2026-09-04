import {
  ButtonBase,
  type ButtonBaseProps,
} from "@/components/ui/Button/ButtonBase";

type ButtonProps = Omit<ButtonBaseProps, "loadingLabel" | "variant"> & {
  variant?: "primary" | "secondary" | "text";
  loadingLabel?: ButtonBaseProps["loadingLabel"];
};

export function Button({ loadingLabel = "처리 중...", ...props }: ButtonProps) {
  return <ButtonBase {...props} loadingLabel={loadingLabel} />;
}
