import type { HTMLAttributes } from "react";
import clsx from "classnames";

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border border-border bg-white/80 px-3 py-1 text-xs font-medium text-foreground",
        className,
      )}
      {...props}
    />
  );
}
