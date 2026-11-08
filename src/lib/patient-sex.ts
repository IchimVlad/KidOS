import type { PatientSex } from "@/lib/patient-select";
import { cn } from "@/lib/utils";

export function sexAccentClass(sex: PatientSex | null | undefined): string {
  if (sex === "female") {
    return "border-sex-female bg-sex-female-soft/70 text-sex-female";
  }
  if (sex === "male") {
    return "border-sex-male bg-sex-male-soft/70 text-sex-male";
  }
  return "border-foreground text-foreground";
}

export function sexAvatarClass(sex: PatientSex | null | undefined): string {
  if (sex === "female") {
    return "border-sex-female bg-sex-female-soft text-sex-female";
  }
  if (sex === "male") {
    return "border-sex-male bg-sex-male-soft text-sex-male";
  }
  return "border-foreground text-foreground";
}

export function sexCardClass(sex: PatientSex | null | undefined): string {
  if (sex === "female") {
    return "border-sex-female/35 bg-sex-female-soft/40";
  }
  if (sex === "male") {
    return "border-sex-male/35 bg-sex-male-soft/40";
  }
  return "";
}

export function sexDotClass(sex: PatientSex | null | undefined): string {
  return cn(
    "inline-block size-2.5 shrink-0 rounded-full",
    sex === "female" && "bg-sex-female",
    sex === "male" && "bg-sex-male",
    sex == null && "bg-foreground/40",
  );
}
