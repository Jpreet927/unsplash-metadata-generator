import * as React from "react";
import clsx from "classnames";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={clsx("text-sm font-medium text-foreground", className)}
      {...props}
    />
  );
}
