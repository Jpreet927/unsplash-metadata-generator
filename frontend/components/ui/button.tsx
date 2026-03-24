import type { ButtonHTMLAttributes } from "react";
import clsx from "classnames";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "ghost";
};

export function Button({
  className,
  variant = "default",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "cursor-pointer inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60",
        variant === "default" &&
          "bg-accent text-accent-foreground shadow-[0_16px_30px_-18px_rgba(31,111,95,0.9)] hover:brightness-105",
        variant === "secondary" &&
          "border border-border bg-panel-strong text-foreground hover:bg-white/90",
        variant === "ghost" && "text-muted hover:text-foreground",
        className,
      )}
      type={type}
      {...props}
    />
  );
}
