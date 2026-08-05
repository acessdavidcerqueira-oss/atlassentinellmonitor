import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "flex min-h-[92px] w-full rounded-md border border-atlas-border bg-[#071126]/90 px-3 py-2 text-sm text-atlas-text outline-none transition placeholder:text-atlas-muted focus:border-atlas-action focus:ring-2 focus:ring-atlas-action/20 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
