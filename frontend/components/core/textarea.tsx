import type { TextareaHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export function TextArea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={twMerge(
        "w-full rounded-2xl border border-border bg-background px-4 py-2 text-base text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-ring resize-none h-auto ",
        className,
      )}
      {...props}
    />
  );
}
