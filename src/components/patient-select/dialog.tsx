"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DemoDialog({
  open,
  title,
  description,
  onClose,
  children,
  size = "sm",
  centered = false,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  centered?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={cn(
        "fixed inset-0 m-auto max-h-[min(90dvh,44rem)] w-[min(100%-2rem,26rem)] overflow-y-auto rounded-2xl border border-border bg-background p-0 text-foreground shadow-none backdrop:bg-foreground/20",
        size === "md" && "w-[min(100%-2rem,32rem)]",
        size === "lg" && "w-[min(100%-2rem,40rem)]",
        "open:animate-in open:fade-in-0 open:zoom-in-95 open:duration-150",
      )}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
    >
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className={cn("space-y-2", centered && "text-center")}>
          <h2
            id={titleId}
            className="text-balance text-lg font-semibold tracking-tight sm:text-xl"
          >
            {title}
          </h2>
          {description ? (
            <p
              id={descriptionId}
              className={cn(
                "text-sm leading-relaxed text-muted-foreground",
                centered && "mx-auto max-w-md",
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
        {children}
      </div>
    </dialog>
  );
}

export function DialogActions({
  onCancel,
  onConfirm,
  confirmLabel,
  formId,
  disabled,
  cancelLabel = "Anulează",
}: {
  onCancel: () => void;
  onConfirm?: () => void;
  confirmLabel: string;
  formId?: string;
  disabled?: boolean;
  cancelLabel?: string;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2 pt-1">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-full px-4 py-2 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {cancelLabel}
      </button>
      <button
        type={formId ? "submit" : "button"}
        form={formId}
        disabled={disabled}
        onClick={formId ? undefined : onConfirm}
        className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-[opacity,transform] duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {confirmLabel}
      </button>
    </div>
  );
}
