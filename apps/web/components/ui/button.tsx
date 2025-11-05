import React, { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const base = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition";
    const variants: Record<ButtonProps["variant"], string> = {
      default: "bg-accent text-slate-900 hover:bg-sky-400",
      outline: "border border-slate-600 text-slate-100 hover:bg-slate-800",
    };
    return (
      <button ref={ref} className={twMerge(base, variants[variant], className)} {...props} />
    );
  }
);

Button.displayName = "Button";
