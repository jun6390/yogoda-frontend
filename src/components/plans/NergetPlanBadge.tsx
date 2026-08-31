interface NergetPlanBadgeProps {
  number: string | number;
  size?: "sm" | "lg";
}

const sizeStyles = {
  sm: {
    left: "h-[53px] w-[54px]",
    right: "h-[53px] w-[36px]",
    logo: "text-[17px]",
    number: "text-[19px]",
    cut: "15px",
    radius: "6px",
  },
  lg: {
    left: "h-[106px] w-[108px]",
    right: "h-[106px] w-[72px]",
    logo: "text-[34px]",
    number: "text-[38px]",
    cut: "30px",
    radius: "12px",
  },
};

export function NergetPlanBadge({ number, size = "sm" }: NergetPlanBadgeProps) {
  const styles = sizeStyles[size];

  return (
    <div
      aria-label={`너겟 ${number} 요금제`}
      className="flex shrink-0 items-stretch gap-0"
    >
      <div
        className={`${styles.left} flex items-center justify-center bg-[#222629]`}
        style={{
          borderRadius: styles.radius,
          clipPath: `polygon(
        ${styles.cut} 0,
        100% 0,
        100% 100%,
        0 100%,
        0 ${styles.cut}
      )`,
        }}
      >
        <span
          className={`${styles.logo} whitespace-nowrap font-sans font-extrabold leading-none tracking-normal text-white`}
        >
          너겟
          <span className="ml-[1px] text-[#FF2D8D]">.</span>
        </span>
      </div>

      <div
        className={`${styles.right} -ml-px flex items-center justify-center bg-[#171A1D]`}
        style={{
          borderRadius: styles.radius,
        }}
      >
        <span
          className={`${styles.number} font-sans font-extrabold leading-none tracking-normal text-white`}
        >
          {number}
        </span>
      </div>
    </div>
  );
}
