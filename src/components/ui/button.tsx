import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-display text-sm font-bold tracking-tight transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "border-2 border-ink bg-coral text-cream shadow-brut hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-lg active:translate-x-0 active:translate-y-0 active:shadow-brut",
        destructive:
          "border-2 border-ink bg-destructive text-destructive-foreground shadow-brut hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-lg active:translate-x-0 active:translate-y-0 active:shadow-brut",
        outline:
          "border-2 border-ink bg-white text-ink shadow-brut hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-lg active:translate-x-0 active:translate-y-0 active:shadow-brut",
        secondary:
          "border-2 border-ink/20 bg-surface-2 text-ink hover:border-ink/40 hover:bg-surface-3 active:bg-surface-3",
        ghost:
          "text-ink hover:bg-surface-2 active:bg-surface-3",
        link:
          "text-coral underline-offset-4 hover:underline",
        gold:
          "border-2 border-ink bg-gold text-ink shadow-brut hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-lg active:translate-x-0 active:translate-y-0 active:shadow-brut",
        ink:
          "border-2 border-ink bg-ink text-cream shadow-brut hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-lg active:translate-x-0 active:translate-y-0 active:shadow-brut",
      },
      size: {
        default: "min-h-12 h-12 px-5 py-2.5 text-sm",
        sm: "min-h-10 h-10 rounded-lg px-3.5 text-xs",
        lg: "min-h-14 h-14 rounded-xl px-8 text-base",
        icon: "min-h-11 min-w-11 h-11 w-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
