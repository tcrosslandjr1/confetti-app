import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-2 border-ink bg-coral text-cream",
        secondary:
          "border border-ink/10 bg-surface-2 text-ink",
        destructive:
          "border-2 border-ink bg-destructive text-destructive-foreground",
        outline:
          "border-2 border-ink bg-transparent text-ink",
        gold:
          "border border-ink/10 bg-gold/20 text-ink",
        coral:
          "border border-ink/10 bg-coral/15 text-coral",
        purple:
          "border border-ink/10 bg-purple/15 text-purple",
        teal:
          "border border-ink/10 bg-teal/15 text-teal",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
