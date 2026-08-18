"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
  onMenuClick?: () => void;
}

const logoText = "Yogoda";

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
        className="text-xl font-bold text-text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
      >
        {logoText}
      </Link>

      <button
        type="button"
        aria-label={navigation("openMenu")}
        onClick={onMenuClick}
        className="flex size-10 items-center justify-center"
      >
        <Menu size={24} />
      </button>
    </header>
  );
}
