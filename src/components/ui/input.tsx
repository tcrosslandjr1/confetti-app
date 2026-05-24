import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl border-2 border-ink/15 bg-surface-1 px-4 py-2.5 text-[15px] font-sans text-ink shadow-xs transition-all duration-200",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-ink",
          "placeholder:text-ink/35",
          "hover:border-ink/25",
          "focus:border-ink focus:shadow-brut focus:outline-none focus:ring-0",
          "aria-[invalid=true]:border-destructive aria-[invalid=true]:shadow-none aria-[invalid=true]:focus:border-destructive aria-[invalid=true]:focus:shadow-[4px_4px_0_0_var(--destructive)]",
          "disabled:cursor-not-allowed disabled:opacity-40",
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
