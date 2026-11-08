import type { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
  className?: string;
};

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className = "",
}: SectionHeadingProps) {
  const alignment = align === "left" ? "text-left" : "text-center mx-auto";

  return (
    <div className={`max-w-2xl ${alignment} ${className}`}>
      {eyebrow ? (
        <p className="mb-3.5 text-sm font-semibold text-zen-primary">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-heading text-3xl leading-[1.2] tracking-[-0.015em] text-gray-900 sm:text-4xl lg:text-[2.65rem]">
        {title}
      </h2>
      {description ? (
        <p className={`mt-4 max-w-xl text-base leading-relaxed text-zen-muted sm:text-lg ${align === "center" ? "mx-auto" : ""}`}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
