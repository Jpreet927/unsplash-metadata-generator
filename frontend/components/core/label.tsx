import type { LabelHTMLAttributes } from "react";
import clsx from "classnames";

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={clsx("text-sm font-medium text-foreground", className)}
      {...props}
    />
  );
}
