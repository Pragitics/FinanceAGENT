import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

type CardProps = {
  className?: string;
  children: ReactNode;
  title?: string;
  subtitle?: string;
};

export function Card({ className, children, title, subtitle }: CardProps) {
  return (
    <section className={twMerge("rounded-lg bg-card p-6 shadow-card", className)}>
      {(title || subtitle) && (
        <header className="mb-4">
          {title && <h2 className="text-lg font-semibold text-white">{title}</h2>}
          {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
        </header>
      )}
      {children}
    </section>
  );
}
