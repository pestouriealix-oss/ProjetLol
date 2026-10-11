import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex h-6 items-center gap-1 rounded-pill px-2.5 text-xs font-semibold whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-raised text-ink-muted",
        accent: "bg-accent-soft text-accent",
        warn: "bg-warn-soft text-warn",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
