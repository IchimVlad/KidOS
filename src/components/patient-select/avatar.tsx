import type { PatientSex } from "@/lib/patient-select";
import { sexAvatarClass } from "@/lib/patient-sex";
import { cn } from "@/lib/utils";

type AvatarTone = "profile" | "add";
type AvatarSize = "sm" | "md" | "lg";

const SIZE_CLASS: Record<AvatarSize, string> = {
  sm: "size-12",
  md: "size-16",
  lg: "size-28 sm:size-32",
};

const ICON_CLASS: Record<AvatarSize, string> = {
  sm: "size-[58%]",
  md: "size-[60%]",
  lg: "size-[62%]",
};

const PLUS_CLASS: Record<AvatarSize, string> = {
  sm: "text-2xl",
  md: "text-3xl",
  lg: "text-5xl sm:text-6xl",
};

export function ProfileAvatar({
  label,
  tone = "profile",
  selected = false,
  size = "lg",
  sex,
  className,
}: {
  label: string;
  tone?: AvatarTone;
  selected?: boolean;
  size?: AvatarSize;
  sex?: PatientSex;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative flex items-center justify-center rounded-full transition-[transform,box-shadow,border-color,background-color,color] duration-200 ease-out",
        SIZE_CLASS[size],
        tone === "profile" && cn("border-[3px]", sexAvatarClass(sex)),
        tone === "add" &&
          "border-[3px] border-dashed border-foreground/35 bg-background text-foreground",
        selected && "ring-4 ring-primary/20 ring-offset-4 ring-offset-background",
        className,
      )}
    >
      {tone === "profile" ? (
        <svg
          viewBox="0 0 64 64"
          className={cn("fill-current", ICON_CLASS[size])}
          role="presentation"
        >
          <circle cx="32" cy="22" r="12" />
          <path d="M10 54c2.8-12.4 12-18 22-18s19.2 5.6 22 18" />
        </svg>
      ) : (
        <span className={cn("font-light leading-none", PLUS_CLASS[size])}>+</span>
      )}
      <span className="sr-only">{label}</span>
    </span>
  );
}