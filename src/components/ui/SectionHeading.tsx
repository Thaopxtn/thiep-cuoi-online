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
        <p className="mb-3.5 inline-flex items-center gap-2 rounded-full bg-rose-50/80 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.18em] text-zen-primary border border-rose-100/60 shadow-xs">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-heading text-3xl leading-[1.2] tracking-[-0.015em] text-gray-900 sm:text-4xl lg:text-[2.65rem]">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg max-w-xl mx-auto">
          {description}
        </p>
      ) : null}
    </div>
  );
}
