import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "border-atlas-border bg-white/6 text-atlas-ice",
        critical: "border-red-400/40 bg-red-500/14 text-red-100",
        high: "border-orange-400/40 bg-orange-500/14 text-orange-100",
        moderate: "border-amber-300/40 bg-amber-400/14 text-amber-100",
        low: "border-sky-300/40 bg-sky-400/12 text-sky-100",
        success: "border-emerald-300/40 bg-emerald-400/12 text-emerald-100",
        muted: "border-slate-300/20 bg-slate-400/10 text-slate-200"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
