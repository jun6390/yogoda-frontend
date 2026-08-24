import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { useTranslations } from "next-intl";

import { Button } from "../Button/Button";
import { FigmaImage } from "../FigmaImage/FigmaImage";

import { cn } from "@/lib/utils";

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  heading: ReactNode;
  description: ReactNode;
  primaryLabel: ReactNode;
  secondaryLabel?: ReactNode;
  onClose?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  onPrimaryClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  onSecondaryClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
}

const modalSparkles = "/figma-assets/icon-modal-sparkles.svg";
const modalClose = "/figma-assets/icon-close.svg";

export function Modal({
  heading,
  description,
  primaryLabel,
  secondaryLabel,
  onClose,
  onPrimaryClick,
  onSecondaryClick,
  className,
  ...props
}: ModalProps) {
  const common = useTranslations("Common");
  const modal = useTranslations("Modal");
  const resolvedSecondaryLabel =
    secondaryLabel === undefined
      ? modal("defaultSecondaryLabel")
      : secondaryLabel;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        "relative flex w-[calc(100vw-40px)] max-w-[350px] flex-col items-center rounded-2xl bg-surface p-2xl text-center shadow-md",
        className,
      )}
      {...props}
    >
      <button
        type="button"
        aria-label={common("close")}
        onClick={onClose}
        className="absolute right-2xl top-2xl flex size-touch items-center justify-center"
      >
        <FigmaImage alt="" src={modalClose} className="size-lg" />
      </button>
      <div className="h-3xl" />
      <div className="flex size-[40px] items-center justify-center rounded-full bg-brand-soft">
        <FigmaImage alt="" src={modalSparkles} className="size-xl" />
      </div>
      <h2 className="mt-lg font-sans text-title-16-bold text-text-primary">
        {heading}
      </h2>
      <p className="whitespace-pre-line py-2xl font-sans text-body-14-regular text-text-secondary">
        {description}
      </p>
      <Button className="h-[48px] w-full rounded-lg" onClick={onPrimaryClick}>
        {primaryLabel}
      </Button>
      <button
        type="button"
        className="mt-md font-sans text-label-14-bold text-text-secondary"
        onClick={onSecondaryClick}
      >
        {resolvedSecondaryLabel}
      </button>
    </div>
  );
}
