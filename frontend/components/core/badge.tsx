import type { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "destructive";
}) {
  return (
    <span
      className={twMerge(
        "inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground",
        variant === "destructive" &&
          "border-red-800 bg-red-950/25 text-red-400",
        className,
      )}
      {...props}
    />
  );
}
