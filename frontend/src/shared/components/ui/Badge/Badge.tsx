"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary-100 text-primary-700 border border-primary-200",
        success: "bg-green-100 text-green-700 border border-green-200",
        warning: "bg-amber-100 text-amber-700 border border-amber-200",
        error: "bg-red-100 text-red-700 border border-red-200",
        info: "bg-blue-100 text-blue-700 border border-blue-200",
        neutral: "bg-neutral-100 text-neutral-700 border border-neutral-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
