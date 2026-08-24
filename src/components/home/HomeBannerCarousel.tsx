"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const bannerSlides = [
  {
    href: "/benefits",
    src: "/yogoda-banners/uplus-benefit.webp",
    altKey: "bannerBenefitAlt",
  },
  {
    href: "/my",
    src: "/yogoda-banners/plan-compare.webp",
    altKey: "bannerPlanAlt",
  },
  {
    href: "/mission",
    src: "/yogoda-banners/mission-point.webp",
    altKey: "bannerMissionAlt",
  },
  {
    href: "/benefits",
    src: "/yogoda-banners/uplus-special.webp",
    altKey: "bannerSpecialAlt",
  },
  {
    href: "/benefits",
    src: "/yogoda-banners/coupon-partner.webp",
    altKey: "bannerCouponAlt",
  },
] as const;

const autoSlideDelay = 5000;

export function HomeBannerCarousel() {
  const t = useTranslations("Home");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    /*
     * 홈 배너는 앱 메인 프로모션 영역이라 자동 순환함
     * 컴포넌트가 사라지면 타이머도 같이 정리함
     */
    const timerId = window.setInterval(() => {
      setActiveIndex(
        (currentIndex) => (currentIndex + 1) % bannerSlides.length,
      );
    }, autoSlideDelay);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  const moveTo = (nextIndex: number) => {
    setActiveIndex((nextIndex + bannerSlides.length) % bannerSlides.length);
  };

  return (
    <section aria-label={t("bannerAriaLabel")} className="relative">
      <div className="relative overflow-hidden rounded-2xl bg-surface shadow-sm">
        <div
          // 이미지 안에 있던 컨트롤은 제거하고 실제 조작은 이 컴포넌트가 담당함
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {bannerSlides.map((slide, index) => {
            const isInitialSlide = index === 0;

            return (
              <Link
                key={slide.src}
                href={slide.href}
                aria-hidden={activeIndex !== index}
                tabIndex={activeIndex === index ? undefined : -1}
                className="relative block aspect-[653/494] min-w-full bg-surface focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-action-primary"
              >
                <Image
                  src={slide.src}
                  alt={t(slide.altKey)}
                  fill
                  loading={isInitialSlide ? "eager" : "lazy"}
                  fetchPriority={isInitialSlide ? "high" : "auto"}
                  sizes="(max-width: 448px) calc(100vw - 40px), 408px"
                  quality={75}
                  className="object-contain"
                />
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          aria-label={t("bannerPrevious")}
          onClick={() => moveTo(activeIndex - 1)}
          className="absolute left-sm top-1/2 flex size-[36px] -translate-y-1/2 items-center justify-center rounded-full bg-surface/85 text-icon-brand shadow-sm backdrop-blur-sm transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
        >
          <ChevronLeft size={20} strokeWidth={2} />
        </button>

        <button
          type="button"
          aria-label={t("bannerNext")}
          onClick={() => moveTo(activeIndex + 1)}
          className="absolute right-sm top-1/2 flex size-[36px] -translate-y-1/2 items-center justify-center rounded-full bg-surface/85 text-icon-brand shadow-sm backdrop-blur-sm transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
        >
          <ChevronRight size={20} strokeWidth={2} />
        </button>

        <div className="absolute bottom-md left-1/2 flex -translate-x-1/2 items-center gap-xs rounded-full bg-surface/80 px-md py-sm shadow-sm backdrop-blur-sm">
          {bannerSlides.map((slide, index) => {
            const isActive = activeIndex === index;

            return (
              <button
                key={slide.src}
                type="button"
                aria-label={t("bannerGoTo", { number: index + 1 })}
                aria-current={isActive ? "true" : undefined}
                onClick={() => moveTo(index)}
                className={cn(
                  "h-[6px] rounded-full transition-all",
                  isActive
                    ? "w-[18px] bg-action-primary"
                    : "w-[6px] bg-border-strong",
                )}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
