import * as React from "react";
import clsx from "classnames";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-[28px] border border-border bg-panel p-6 shadow-[0_30px_60px_-40px_rgba(50,38,15,0.4)] backdrop-blur",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={clsx("text-xl font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={clsx("text-sm text-muted", className)} {...props} />;
}
