"use client";

import { Bell, Menu } from "lucide-react";
import { useTranslations } from "next-intl";

import { FigmaImage } from "../FigmaImage/FigmaImage";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
  onMenuClick?: () => void;
}

const logoText = "Yogoda";
const logoSrc = "/yogoda-logo.svg";

export function Header({ className, onMenuClick }: HeaderProps) {
  const navigation = useTranslations("Navigation");

  return (
    <header
      className={cn(
        "flex h-[56px] w-full items-center justify-between bg-surface px-5",
        className,
      )}
    >
      <Link
        href="/"
        aria-label={`${logoText} ${navigation("home")}`}
        className="flex h-touch items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
      >
        <FigmaImage alt="" src={logoSrc} className="h-[20px] w-auto" />
      </Link>

      <div className="flex items-center">
        <button
          type="button"
          aria-label={navigation("notifications")}
          className="relative flex size-10 items-center justify-center text-icon-default focus-visible:outline-2 focus-visible:outline-action-primary"
        >
          <Bell aria-hidden="true" size={24} strokeWidth={1.8} />
          <span className="absolute right-[7px] top-[6px] size-[7px] rounded-full bg-action-primary ring-2 ring-surface" />
        </button>

        <button
          type="button"
          aria-label={navigation("openMenu")}
          onClick={onMenuClick}
          className="flex size-10 items-center justify-center"
        >
          <Menu size={24} />
        </button>
      </div>
    </header>
  );
}
