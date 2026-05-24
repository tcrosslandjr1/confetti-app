import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl border-2 border-ink/15 bg-surface-1 px-4 py-2.5 text-[15px] font-sans shadow-xs transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/60 hover:border-ink/25 focus:border-ink focus:shadow-brut focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-40",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
