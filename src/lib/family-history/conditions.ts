// Catalogul de afecțiuni din istoricul familial, grupat pe categorii.
// Codurile sunt stabile (se salvează în baza de date); etichetele pot fi modificate liber.

export type ConditionCategory = {
  id: string;
  label: string;
  conditions: { code: string; label: string; hint?: string }[];
};

export const CONDITION_CATEGORIES: ConditionCategory[] = [
  {
    id: "allergy",
    label: "Alergii și atopie",
    conditions: [
      { code: "food_allergy", label: "Alergii alimentare" },
      { code: "asthma", label: "Astm" },
      { code: "atopic_dermatitis", label: "Dermatită atopică" },
      { code: "allergic_rhinitis", label: "Rinită alergică" },
    ],
  },
  {
    id: "cardio",
    label: "Cardiovascular",
    conditions: [
      { code: "sudden_death_under_50", label: "Moarte subită sub 50 de ani" },
      { code: "congenital_heart_disease", label: "Cardiopatii congenitale" },
      { code: "familial_hypercholesterolemia", label: "Hipercolesterolemie familială" },
      { code: "hypertension", label: "Hipertensiune" },
    ],
  },
  {
    id: "metabolic",
    label: "Metabolic / endocrin",
    conditions: [
      { code: "diabetes_t1", label: "Diabet tip 1" },
      { code: "diabetes_t2", label: "Diabet tip 2" },
      { code: "thyroid_disease", label: "Boli tiroidiene" },
      { code: "obesity", label: "Obezitate" },
    ],
  },
  {
    id: "neuro",
    label: "Neurologic",
    conditions: [
      { code: "epilepsy", label: "Epilepsie" },
      { code: "febrile_seizures", label: "Convulsii febrile" },
      { code: "migraine", label: "Migrenă" },
    ],
  },
  {
    id: "neurodev",
    label: "Neurodezvoltare și psihic",
    conditions: [
      { code: "adhd", label: "ADHD" },
      { code: "autism_spectrum", label: "Tulburări de spectru autist" },
      { code: "depression", label: "Depresie" },
      { code: "anxiety", label: "Anxietate" },
    ],
  },
  {
    id: "genetic",
    label: "Boli genetice",
    conditions: [
      { code: "cystic_fibrosis", label: "Fibroză chistică" },
      { code: "thalassemia", label: "Talasemie" },
      { code: "hemophilia", label: "Hemofilie" },
      { code: "sickle_cell", label: "Siclemie" },
      { code: "down_syndrome", label: "Sindrom Down" },
    ],
  },
  {
    id: "other",
    label: "Altele",
    conditions: [
      { code: "celiac_disease", label: "Boală celiacă" },
      { code: "autoimmune_disease", label: "Boli autoimune" },
      { code: "cancer", label: "Cancer", hint: "Precizați tipul în notă și vârsta la debut." },
      { code: "congenital_deafness", label: "Surditate congenitală" },
      { code: "hip_dysplasia", label: "Displazie de șold" },
      { code: "other", label: "Altele", hint: "Descrieți afecțiunea în câmpul de mai jos." },
    ],
  },
];

const BY_CODE = new Map(
  CONDITION_CATEGORIES.flatMap((category) =>
    category.conditions.map((condition) => [condition.code, { ...condition, category: category.label }] as const),
  ),
);

export const CONDITION_CODES = [...BY_CODE.keys()] as [string, ...string[]];

export function conditionLabel(code: string, customLabel?: string | null): string {
  if (code === "other" && customLabel) return customLabel;
  return BY_CODE.get(code)?.label ?? code;
}

/** Căutare fără diacritice și fără majuscule, în etichete și categorii. */
export function searchConditions(query: string): ConditionCategory[] {
  const normalize = (text: string) =>
    text
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
  const needle = normalize(query.trim());
  if (needle.length === 0) return CONDITION_CATEGORIES;

  return CONDITION_CATEGORIES.map((category) => ({
    ...category,
    conditions: category.conditions.filter(
      (condition) => normalize(condition.label).includes(needle) || normalize(category.label).includes(needle),
    ),
  })).filter((category) => category.conditions.length > 0);
}
