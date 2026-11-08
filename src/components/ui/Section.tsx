import type { ReactNode } from "react";

type SectionProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  bg?: "white" | "warm" | "subtle";
  padding?: "sm" | "md" | "lg";
  ariaLabel?: string;
};

export default function Section({
  id,
  children,
  className = "",
  containerClassName = "",
  bg = "white",
  padding = "lg",
  ariaLabel,
}: SectionProps) {
  const bgMap = {
    white: "bg-white",
    warm: "bg-zen-surface",
    subtle: "bg-zen-subtle",
  };
  const paddingMap = {
    sm: "py-12 sm:py-16",
    md: "py-16 sm:py-20",
    lg: "py-20 sm:py-28",
  };

  return (
    <section
      id={id}
      className={`${bgMap[bg]} ${paddingMap[padding]} transition-colors duration-300 ${className}`}
      aria-label={ariaLabel}
    >
      <div className={`zen-container ${containerClassName}`}>
        {children}
      </div>
    </section>
  );
}
