import { getTranslations } from "next-intl/server";
import {
  BarChart3,
  Barcode,
  Bell,
  CalendarDays,
  ChevronRight,
  CreditCard,
  Gift,
  ReceiptText,
  Sparkles,
  TicketPercent,
} from "lucide-react";

import { PageContainer } from "@/components/layout/PageContainer";
import { HomeBannerCarousel } from "@/components/home/HomeBannerCarousel";
import { ProgressBar } from "@/components/ui/ProgressBar/ProgressBar";
import { Link } from "@/i18n/navigation";
import { PlanSubNav } from "@/components/plans/PlanSubNav";

const usageValue = 55;

export default async function HomePage() {
  const t = await getTranslations("Home");

  const quickActions = [
    {
      href: "/my",
      label: t("quickPlan"),
      icon: ReceiptText,
    },
    {
      href: "/benefits",
      label: t("quickBenefit"),
      icon: Gift,
    },
    {
      href: "/my",
      label: t("quickAnalysis"),
      icon: BarChart3,
    },
    {
      href: "/ai",
      label: t("quickConsulting"),
      icon: Sparkles,
    },
  ] as const;

  const todoItems = [
    {
      href: "/my",
      title: t("todoContractTitle"),
      description: t("todoContractDescription"),
      icon: CalendarDays,
    },
    {
      href: "/benefits",
      title: t("todoCouponTitle"),
      description: t("todoCouponDescription"),
      icon: Bell,
    },
  ] as const;

  return (
    <>
      <PlanSubNav />
      <PageContainer className="flex flex-col gap-2xl pb-2xl pt-md">
        <HomeBannerCarousel />

        <Link
          href="/my"
          className="flex flex-col gap-md py-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
        >
          <div className="flex items-center justify-between gap-md font-sans text-title-16-bold">
            <h2 className="text-text-primary">{t("usageTitle")}</h2>
            <p className="shrink-0 text-action-primary">{t("usageAmount")}</p>
          </div>

          <ProgressBar
            value={usageValue}
            aria-label={t("usageTitle")}
            className="h-[10px] w-full bg-border-default"
          />

          <div className="flex flex-wrap items-center gap-x-sm gap-y-xs font-sans text-caption-13-bold text-text-secondary">
            <span>{t("usagePrice")}</span>
            <span>{t("usageCall")}</span>
            <span>{t("usageOtt")}</span>
          </div>
        </Link>

        <section className="grid grid-cols-2 gap-sm">
          {/* 실제 통신 앱 홈에서 가장 먼저 확인하는 요금/납부 정보임 */}
          <Link
            href="/my"
            className="flex min-h-[132px] flex-col justify-between rounded-lg bg-surface p-lg shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
          >
            <div className="flex items-start justify-between gap-sm">
              <span className="flex size-[32px] shrink-0 items-center justify-center rounded-sm bg-brand-soft text-icon-brand">
                <CreditCard size={20} strokeWidth={1.8} />
              </span>
              <ChevronRight
                aria-hidden="true"
                className="shrink-0 text-icon-secondary"
                size={18}
              />
            </div>

            <div>
              <p className="font-sans text-caption-12-bold text-text-secondary">
                {t("billingTitle")}
              </p>
              <p className="mt-xs font-sans text-title-20-bold text-text-primary">
                {t("billingAmount")}
              </p>
              <p className="mt-xs font-sans text-micro-11-regular text-text-tertiary">
                {t("billingDueDate")}
              </p>
            </div>
          </Link>

          <Link
            href="/benefits"
            className="flex min-h-[132px] flex-col justify-between rounded-lg bg-surface p-lg shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
          >
            <div className="flex items-start justify-between gap-sm">
              <span className="flex size-[32px] shrink-0 items-center justify-center rounded-sm bg-brand-soft text-icon-brand">
                <TicketPercent size={20} strokeWidth={1.8} />
              </span>
              <ChevronRight
                aria-hidden="true"
                className="shrink-0 text-icon-secondary"
                size={18}
              />
            </div>

            <div>
              <p className="font-sans text-caption-12-bold text-text-secondary">
                {t("couponTitle")}
              </p>
              <p className="mt-xs font-sans text-title-20-bold text-text-primary">
                {t("couponCount")}
              </p>
              <p className="mt-xs font-sans text-micro-11-regular text-text-tertiary">
                {t("couponDescription")}
              </p>
            </div>
          </Link>
        </section>

        <section className="flex flex-col gap-md">
          <div className="flex items-center justify-between gap-md">
            <h2 className="font-sans text-title-16-bold text-text-primary">
              {t("todoTitle")}
            </h2>
            <span className="font-sans text-caption-12-bold text-action-primary">
              {t("todoCount")}
            </span>
          </div>

          <div className="flex flex-col rounded-lg bg-surface shadow-sm">
            {todoItems.map(({ href, title, description, icon: Icon }) => (
              <Link
                key={title}
                href={href}
                className="flex min-h-[72px] items-center gap-md border-b border-border-default px-lg py-md last:border-b-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-action-primary"
              >
                <span className="flex size-[36px] shrink-0 items-center justify-center rounded-sm bg-surface-subtle text-icon-brand">
                  <Icon size={20} strokeWidth={1.8} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate font-sans text-label-14-bold text-text-primary">
                    {title}
                  </span>
                  <span className="mt-xs block truncate font-sans text-caption-12-regular text-text-secondary">
                    {description}
                  </span>
                </span>

                <ChevronRight
                  aria-hidden="true"
                  className="shrink-0 text-icon-secondary"
                  size={18}
                />
              </Link>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-md">
          <div className="flex items-center justify-between gap-md">
            <h2 className="font-sans text-title-16-bold text-text-primary">
              {t("quickTitle")}
            </h2>
            <Link
              href="/my"
              className="font-sans text-caption-12-medium text-text-tertiary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
            >
              {t("viewAll")} ›
            </Link>
          </div>

          <div className="grid grid-cols-4 justify-between gap-sm">
            {quickActions.map(({ href, label, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className="flex h-[72px] flex-col items-center justify-center gap-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
              >
                <span className="flex size-[32px] items-center justify-center rounded-sm bg-brand-soft text-icon-brand">
                  <Icon size={24} strokeWidth={1.8} />
                </span>
                <span className="whitespace-nowrap font-sans text-caption-12-bold text-text-primary">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-md">
          <div className="flex items-center justify-between gap-md">
            <h2 className="font-sans text-title-16-bold text-text-primary">
              {t("membershipTitle")}
            </h2>
            <Link
              href="/benefits"
              className="font-sans text-caption-12-medium text-text-tertiary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
            >
              {t("viewAll")} ›
            </Link>
          </div>

          <Link
            href="/benefits"
            className="flex items-center justify-between gap-lg rounded-lg bg-surface p-lg shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
          >
            <div className="flex min-w-0 items-center gap-md">
              <span className="flex size-[44px] shrink-0 items-center justify-center rounded-lg bg-brand-soft text-icon-brand">
                <Barcode size={26} strokeWidth={1.7} />
              </span>

              <div className="min-w-0">
                <p className="truncate font-sans text-title-16-bold text-text-primary">
                  {t("membershipGrade")}
                </p>
                <p className="mt-xs truncate font-sans text-caption-12-regular text-text-secondary">
                  {t("membershipDescription")}
                </p>
              </div>
            </div>

            <span className="shrink-0 rounded-full bg-brand-soft px-md py-sm font-sans text-caption-12-bold text-text-brand">
              {t("membershipAction")}
            </span>
          </Link>
        </section>

        <Link
          href="/benefits"
          className="flex items-center justify-between gap-lg py-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
        >
          <div className="min-w-0">
            <h2 className="truncate font-sans text-title-16-bold text-text-primary">
              {t("personalBenefitTitle")}
            </h2>
            <p className="mt-xs truncate font-sans text-body-14-regular text-text-secondary">
              {t("personalBenefitDescription")}
            </p>
          </div>

          <span className="shrink-0 font-sans text-label-14-bold text-action-primary">
            {t("view")} →
          </span>
        </Link>
      </PageContainer>
    </>
  );
}
