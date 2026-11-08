// Recomandări generale, orientative, pe categorii de vârstă.
// Fără doze, fără diagnostic; nu înlocuiesc sfatul medicului.

import type { PatientRelation } from "@/lib/patient-select";
import type { FoodGroup } from "@/lib/nutrition/types";

export type AgeCategory = "child" | "adult" | "elder";

export type NutritionRecommendation = {
  category: AgeCategory;
  label: string;
  /** Aport orientativ de lichide pe zi, în ml. */
  waterTargetMl: number;
  /** Grupe pe care e bine să le regăsim zilnic în jurnal. */
  dailyGroups: FoodGroup[];
  tips: string[];
};

export const NUTRITION_RECOMMENDATIONS: Record<AgeCategory, NutritionRecommendation> = {
  child: {
    category: "child",
    label: "Copii",
    waterTargetMl: 1500,
    dailyGroups: ["vegetables", "fruits", "grains", "protein", "dairy"],
    tips: [
      "Mesele regulate, la ore cât mai constante, ajută copilul să-și recunoască senzația de foame și de sațietate.",
      "Apa este cea mai bună alegere pentru hidratare; băuturile îndulcite se oferă ocazional.",
      "Un aliment nou poate fi oferit de mai multe ori până când copilul îl acceptă. Notați orice reacție observată.",
    ],
  },
  adult: {
    category: "adult",
    label: "Adulți",
    waterTargetMl: 2000,
    dailyGroups: ["vegetables", "fruits", "grains", "protein", "dairy"],
    tips: [
      "Legumele și fructele pot ocupa o parte importantă din fiecare masă principală.",
      "Preferați cerealele integrale și limitați alimentele foarte procesate.",
      "Necesarul de lichide crește la efort fizic și pe vreme caldă.",
    ],
  },
  elder: {
    category: "elder",
    label: "Persoane vârstnice",
    waterTargetMl: 1700,
    dailyGroups: ["vegetables", "fruits", "grains", "protein", "dairy"],
    tips: [
      "Senzația de sete poate scădea odată cu vârsta; beți apă la intervale regulate, chiar fără sete.",
      "Mesele mai mici și mai dese pot fi mai ușor de tolerat.",
      "Discutați cu medicul despre alimentație dacă urmați tratamente de lungă durată.",
    ],
  },
};

export function ageCategoryFromRelation(relation: PatientRelation): AgeCategory {
  if (relation === "child") {
    return "child";
  }
  if (relation === "elder") {
    return "elder";
  }
  return "adult";
}

export function recommendationFor(relation: PatientRelation): NutritionRecommendation {
  return NUTRITION_RECOMMENDATIONS[ageCategoryFromRelation(relation)];
}
