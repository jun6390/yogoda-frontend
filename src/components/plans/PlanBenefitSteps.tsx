import type { ReactNode } from "react";
import {
  Check,
  Database,
  Gift,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";
import type { PlanChoiceBenefit, PlanChoiceBenefitOption } from "@/types/plan";

interface ChoiceStepProps {
  step: PlanChoiceBenefit;
  title: string;
  instruction?: string;
  selectedCodes: string[];
  disabled: boolean;
  onSelect: (optionCode: string) => void;
  formatNumber: (value: number) => string;
  monthlyValueLabel: (amount: string) => string;
}

export function ChoiceStep({
  step,
  title,
  instruction,
  selectedCodes,
  disabled,
  onSelect,
  formatNumber,
  monthlyValueLabel,
}: ChoiceStepProps) {
  return (
    <section>
      <div className="flex items-end justify-between gap-md">
        <div>
          <h3 className="font-sans text-label-14-bold text-text-primary">
            {title}
          </h3>

          {instruction && (
            <p className="mt-xs font-sans text-caption-13-medium text-text-secondary">
              {instruction}
            </p>
          )}
        </div>

        <span className="shrink-0 font-sans text-micro-11-regular text-text-secondary">
          {selectedCodes.length}/{step.selectionCount}
        </span>
      </div>

      <div className="mt-md grid grid-cols-2 gap-sm">
        {step.options.map((option) => {
          const isSelected = selectedCodes.includes(option.code);

          const selectionLimitReached =
            step.selectionCount > 1 &&
            selectedCodes.length >= step.selectionCount &&
            !isSelected;

          return (
            <button
              key={option.code}
              type="button"
              disabled={disabled || selectionLimitReached}
              aria-pressed={isSelected}
              onClick={() => onSelect(option.code)}
              className={`min-h-[104px] rounded-lg border-2 p-md text-left transition-colors ${
                isSelected
                  ? "border-action-primary bg-surface"
                  : "border-border-default bg-surface"
              } ${
                disabled
                  ? "cursor-default"
                  : selectionLimitReached
                    ? "cursor-not-allowed opacity-40"
                    : ""
              }`}
            >
              <BenefitOptionContent
                option={option}
                selected={isSelected}
                formatNumber={formatNumber}
                monthlyValueLabel={monthlyValueLabel}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}

interface InfoStepProps {
  step: PlanChoiceBenefit;
  title: string;
  instruction?: string;
  formatNumber: (value: number) => string;
  monthlyValueLabel: (amount: string) => string;
}

function getBenefitIcon(option: PlanChoiceBenefitOption) {
  if (
    option.code === "smart-device-discount" ||
    option.title.includes("스마트기기")
  ) {
    return <Smartphone aria-hidden="true" size={18} />;
  }

  if (option.code === "family-bundle" || option.title.includes("가족")) {
    return <Users aria-hidden="true" size={18} />;
  }

  if (
    option.title.includes("피싱") ||
    option.title.includes("해킹") ||
    option.title.includes("안심")
  ) {
    return <ShieldCheck aria-hidden="true" size={18} />;
  }

  if (option.title.includes("데이터")) {
    return <Database aria-hidden="true" size={18} />;
  }

  return <Gift aria-hidden="true" size={18} />;
}

export function InfoStep({
  step,
  title,
  instruction,
  formatNumber,
  monthlyValueLabel,
}: InfoStepProps) {
  return (
    <section>
      <h3 className="font-sans text-label-14-bold text-text-primary">
        {title}
      </h3>

      {instruction && (
        <p className="mt-xs font-sans text-caption-13-medium text-text-secondary">
          {instruction}
        </p>
      )}

      <div className="mt-md overflow-hidden rounded-xl bg-surface-subtle px-lg">
        {step.options.map((option, index) => (
          <div
            key={option.code}
            className={`py-lg ${
              index !== step.options.length - 1
                ? "border-b border-border-default"
                : ""
            }`}
          >
            <div className="flex items-start justify-between gap-md">
              <div className="min-w-0 flex-1">
                <p className="font-sans text-label-14-bold text-text-primary">
                  {option.title}
                </p>

                {option.monthlyValue !== null && (
                  <p className="mt-xs font-sans text-micro-11-bold text-action-primary">
                    {monthlyValueLabel(formatNumber(option.monthlyValue))}
                  </p>
                )}
              </div>

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-action-primary/10 text-action-primary">
                {getBenefitIcon(option)}
              </div>
            </div>

            {option.description && (
              <p className="mt-sm font-sans text-micro-11-regular leading-relaxed text-text-secondary">
                {option.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

interface BenefitOptionContentProps {
  option: PlanChoiceBenefitOption;
  selected?: boolean;
  formatNumber: (value: number) => string;
  monthlyValueLabel: (amount: string) => string;
}

function BenefitOptionContent({
  option,
  selected = false,
  formatNumber,
  monthlyValueLabel,
}: BenefitOptionContentProps) {
  return (
    <>
      <div className="flex items-start justify-between gap-sm">
        <div className="min-w-0">
          {option.brand && (
            <p className="mb-xs font-sans text-micro-11-regular text-text-secondary">
              {option.brand}
            </p>
          )}

          <p
            className={`font-sans text-caption-13-bold ${
              selected ? "text-action-primary" : "text-text-primary"
            }`}
          >
            {option.title}
          </p>
        </div>

        {selected && (
          <Check
            aria-hidden="true"
            size={17}
            className="shrink-0 text-action-primary"
          />
        )}
      </div>

      {option.description && (
        <p className="mt-sm font-sans text-micro-11-regular leading-relaxed text-text-secondary">
          {option.description}
        </p>
      )}

      {option.monthlyValue !== null && (
        <p className="mt-sm font-sans text-micro-11-bold text-text-primary">
          {monthlyValueLabel(formatNumber(option.monthlyValue))}
        </p>
      )}
    </>
  );
}

interface PlanUsageItemProps {
  icon: ReactNode;
  value: string;
  label: string;
  bordered?: boolean;
  wrap?: boolean;
}

export function PlanUsageItem({
  icon,
  value,
  label,
  bordered = false,
  wrap = false,
}: PlanUsageItemProps) {
  return (
    <div
      className={`relative flex min-w-0 flex-col items-center px-xs py-lg text-center ${
        bordered
          ? "before:absolute before:left-0 before:top-1/2 before:h-[56px] before:-translate-y-1/2 before:border-l before:border-border-default after:absolute after:right-0 after:top-1/2 after:h-[56px] after:-translate-y-1/2 after:border-r after:border-border-default"
          : ""
      }`}
    >
      <span className="text-action-primary">{icon}</span>

      <p
        className={`mt-sm max-w-full text-center font-sans text-caption-13-bold text-text-primary ${
          wrap ? "whitespace-normal break-keep leading-snug" : "truncate"
        }`}
      >
        {value}
      </p>

      <span className="mt-xs font-sans text-micro-11-regular text-text-secondary">
        {label}
      </span>
    </div>
  );
}

interface CompactInfoProps {
  label: string;
  value: string;
}

export function CompactInfo({ label, value }: CompactInfoProps) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-lg">
      <span className="shrink-0 font-sans text-micro-11-regular text-text-secondary">
        {label}
      </span>

      <span className="text-right font-sans text-micro-11-bold text-text-primary">
        {value}
      </span>
    </div>
  );
}
