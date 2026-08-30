import type { ButtonHTMLAttributes, HTMLAttributes } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "../Badge/Badge";
import { Button } from "../Button/Button";
import { FigmaImage } from "../FigmaImage/FigmaImage";

import { cn } from "@/lib/utils";

type BottomSheetType = "login" | "confirmation" | "permission" | "place";

interface BottomSheetProps extends HTMLAttributes<HTMLDivElement> {
  type?: BottomSheetType;
  onClose?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
}

const closeIcon = "/figma-assets/icon-close.svg";
const shieldIcon = "/figma-assets/icon-shield-check.svg";
const cardIcon = "/figma-assets/icon-credit-card.svg";
const bellIcon = "/figma-assets/icon-bell.svg";
const heartIcon = "/figma-assets/icon-heart.svg";

export function BottomSheet({
  type = "login",
  onClose,
  className,
  ...props
}: BottomSheetProps) {
  if (type === "place") {
    return <PlaceBottomSheet className={className} {...props} />;
  }

  return (
    <div
      className={cn(
        "relative flex w-[calc(100vw-40px)] max-w-[350px] flex-col gap-xl rounded-xl bg-surface p-2xl shadow-lg",
        type === "permission" && "gap-xl",
        className,
      )}
      {...props}
    >
      <CloseButton onClick={onClose} />
      {type === "login" ? <LoginContent /> : null}
      {type === "confirmation" ? <ConfirmationContent /> : null}
      {type === "permission" ? <PermissionContent /> : null}
    </div>
  );
}

function CloseButton({
  onClick,
}: {
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
}) {
  const t = useTranslations("Common");

  return (
    <button
      type="button"
      aria-label={t("close")}
      onClick={onClick}
      className="absolute right-2xl top-2xl flex size-touch items-center justify-center"
    >
      <FigmaImage alt="" src={closeIcon} className="size-lg" />
    </button>
  );
}

function SheetIcon({
  src,
  tone = "soft",
}: {
  src: string;
  tone?: "soft" | "gray";
}) {
  return (
    <span
      className={cn(
        "flex size-[40px] items-center justify-center rounded-full",
        tone === "soft" ? "bg-brand-soft" : "bg-surface-subtle",
      )}
    >
      <FigmaImage alt="" src={src} className="size-xl" />
    </span>
  );
}

function LoginContent() {
  const t = useTranslations("BottomSheet");

  return (
    <>
      <div className="flex justify-center">
        <SheetIcon src={shieldIcon} />
      </div>
      <div className="space-y-sm">
        <h2 className="font-sans text-title-20-bold text-text-primary">
          {t("loginTitle")}
        </h2>
        <p className="whitespace-pre-line font-sans text-label-14-medium text-text-secondary">
          {t("loginDescription")}
        </p>
        <p className="font-sans text-caption-12-regular text-text-tertiary">
          {t("loginCaption")}
        </p>
      </div>
      <div className="flex flex-col items-center gap-lg">
        <Button className="h-[48px] w-full rounded-lg">
          {t("loginPrimary")}
        </Button>
        <button className="font-sans text-label-14-bold text-text-secondary underline">
          {t("loginSecondary")}
        </button>
      </div>
    </>
  );
}

function ConfirmationContent() {
  const t = useTranslations("BottomSheet");

  return (
    <>
      <div className="flex justify-center">
        <SheetIcon src={cardIcon} tone="gray" />
      </div>
      <div className="space-y-sm text-center">
        <h2 className="font-sans text-title-18-bold text-text-primary">
          {t("confirmationTitle")}
        </h2>
        <p className="font-sans text-body-14-regular text-text-secondary">
          {t("confirmationDescription")}
        </p>
        <p className="font-sans text-caption-13-regular text-text-tertiary">
          {t("confirmationCaption")}
        </p>
      </div>
      <div className="flex items-center justify-center gap-md rounded-md bg-surface-subtle p-[14px]">
        <span className="size-2xl rounded-xs bg-[#ffeb00]" />
        <span className="text-center">
          <span className="block font-sans text-caption-13-bold text-text-primary">
            {t("confirmationPaymentName")}
          </span>
          <span className="block font-sans text-micro-11-regular text-text-tertiary">
            {t("confirmationPaymentCaption")}
          </span>
        </span>
      </div>
      <div className="flex flex-col items-center gap-md">
        <Button className="h-[48px] w-full rounded-lg">
          {t("confirmationKeep")}
        </Button>
        <button className="h-[32px] font-sans text-label-14-bold text-error">
          {t("confirmationDelete")}
        </button>
      </div>
    </>
  );
}

function PermissionContent() {
  const t = useTranslations("BottomSheet");

  return (
    <>
      <div className="h-2xl" />
      <div className="flex flex-col items-center gap-lg text-center">
        <SheetIcon src={bellIcon} />
        <h2 className="font-sans text-title-18-bold text-text-primary">
          {t("permissionTitle")}
        </h2>
        <p className="whitespace-pre-line font-sans text-label-14-medium text-text-secondary">
          {t("permissionDescription")}
        </p>
        <p className="whitespace-pre-line font-sans text-caption-13-medium text-text-tertiary">
          {t("permissionCaption")}
        </p>
      </div>
      <div className="flex flex-col items-center gap-lg">
        <Button className="h-[48px] w-full rounded-lg">
          {t("permissionOpenSettings")}
        </Button>
        <button className="font-sans text-label-14-bold text-text-secondary">
          {t("permissionLater")}
        </button>
        <div className="h-px w-full bg-border-default" />
        <p className="text-center font-sans text-caption-12-regular text-text-tertiary">
          {t("permissionFootnote")}
        </p>
      </div>
    </>
  );
}

function PlaceBottomSheet({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const t = useTranslations("BottomSheet");

  return (
    <div
      className={cn(
        "flex w-full max-w-[390px] flex-col gap-lg border-t border-border-default bg-surface px-2xl pb-xl pt-md",
        className,
      )}
      {...props}
    >
      <div className="flex justify-center">
        <span className="h-xs w-[36px] rounded-full bg-border-default" />
      </div>
      <div className="space-y-md">
        <div className="flex items-center justify-between gap-lg">
          <div className="flex items-center gap-sm">
            <span className="size-[32px] rounded-sm bg-[#00704a]" />
            <span>
              <span className="block font-sans text-label-14-bold text-text-primary">
                {t("placeName")}
              </span>
              <span className="block font-sans text-caption-12-regular text-text-secondary">
                {t("placeDistance")}
              </span>
            </span>
          </div>
          <Badge variant="accent">{t("placeBadge")}</Badge>
        </div>
        <div>
          <h2 className="font-sans text-title-18-bold text-text-primary">
            {t("placeTitle")}
          </h2>
          <p className="font-sans text-caption-12-regular text-text-secondary">
            {t("placeDescription")}
          </p>
        </div>
      </div>
      <div className="flex gap-md">
        <Button className="h-[54px] flex-1 rounded-lg">
          {t("placePrimary")}
        </Button>
        <button
          type="button"
          aria-label={t("placeSave")}
          className="flex size-[54px] items-center justify-center rounded-lg border border-border-default"
        >
          <FigmaImage alt="" src={heartIcon} className="size-xl" />
        </button>
      </div>
      <p className="text-center font-sans text-caption-12-regular text-text-secondary">
        {t("placeMore")}
      </p>
    </div>
  );
}
