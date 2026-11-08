import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DemoBadge() {
  return (
    <p className="w-fit rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
      Date demonstrative · nesalvate
    </p>
  );
}

export function SectionCard({
  title,
  action,
  children,
  className,
  bodyClassName,
  emphasized = false,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  emphasized?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-background p-5 sm:p-6",
        emphasized && "border-foreground/15 sm:p-7",
        className,
      )}
    >
      <div className="mb-4 flex shrink-0 items-start justify-between gap-3">
        <h2
          className={cn(
            "font-semibold tracking-tight text-foreground",
            emphasized ? "text-xl sm:text-2xl" : "text-base sm:text-lg",
          )}
        >
          {title}
        </h2>
        {action}
      </div>
      <div className={cn(bodyClassName)}>{children}</div>
    </section>
  );
}

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex flex-wrap gap-2"
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              active
                ? "bg-foreground text-background"
                : "bg-muted text-foreground hover:bg-muted/80",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
  );
}

export function MetaLine({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs leading-relaxed text-muted-foreground">{children}</p>
  );
}

export function TextButton({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-sm font-medium text-muted-foreground underline-offset-4 transition-colors duration-150 hover:text-foreground hover:underline",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({
  children,
  onClick,
  className,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity duration-150 hover:opacity-90",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-muted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
    >
      {children}
    </button>
  );
}
