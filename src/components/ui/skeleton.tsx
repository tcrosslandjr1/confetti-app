import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-xl bg-cream/[0.06]",
        "before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-cream/[0.06] before:to-transparent before:animate-[skeleton-shimmer_1.8s_ease-in-out_infinite] before:bg-[length:200%_100%]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
