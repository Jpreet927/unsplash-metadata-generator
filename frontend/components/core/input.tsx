import type { InputHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={twMerge(
        "h-12 w-full rounded-2xl border border-border bg-background px-4 text-base text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-ring",
        className,
      )}
      {...props}
    />
  );
}
