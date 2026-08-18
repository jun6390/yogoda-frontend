import type { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  className?: string;
}

export function Section({ children, className = "" }: SectionProps) {
  return (
    <section className={`flex flex-col gap-4 ${className}`}>{children}</section>
  );
}
