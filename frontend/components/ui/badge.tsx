import type { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={twMerge(
        "inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground",
        className,
      )}
      {...props}
    />
  );
}
