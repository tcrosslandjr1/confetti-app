import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-cream/15 bg-coral text-cream",
        secondary: "border-cream/10 bg-cream/5 text-cream",
        destructive: "border-destructive/20 bg-destructive text-destructive-foreground",
        outline: "border-cream/20 bg-transparent text-cream",
        gold: "border-gold/25 bg-gold/15 text-cream",
        coral: "border-coral/25 bg-coral/10 text-coral",
        purple: "border-purple/25 bg-purple/10 text-purple",
        teal: "border-teal/25 bg-teal/10 text-teal",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
