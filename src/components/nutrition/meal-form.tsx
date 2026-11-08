"use client";

import { useId, useState, type FormEvent } from "react";
import { FilterChips } from "@/components/patient-dashboard/ui";
import { FOOD_GROUP_LABEL, MEAL_ORDER, MEAL_TYPE_LABEL } from "@/lib/nutrition/labels";
import {
  FOOD_GROUPS,
  createNutritionEntrySchema,
  firstIssueMessage,
  type CreateNutritionEntry,
  type FoodGroup,
  type MealType,
} from "@/lib/nutrition/types";
import { cn } from "@/lib/utils";

const fieldClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function MealForm({
  formId,
  date,
  initialMealType,
  onSubmit,
}: {
  formId: string;
  date: string;
  initialMealType: MealType;
  onSubmit: (entry: CreateNutritionEntry) => void;
}) {
  const ids = useId();
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [description, setDescription] = useState("");
  const [foodGroups, setFoodGroups] = useState<FoodGroup[]>([]);
  const [hadReaction, setHadReaction] = useState(false);
  const [reactionNotes, setReactionNotes] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function toggleGroup(group: FoodGroup) {
    setFoodGroups((current) =>
      current.includes(group) ? current.filter((g) => g !== group) : [...current, group],
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = createNutritionEntrySchema.safeParse({
      date,
      mealType,
      description,
      // Ordinea din catalog, indiferent de ordinea bifării.
      foodGroups: FOOD_GROUPS.filter((group) => foodGroups.includes(group)),
      hadReaction,
      reactionNotes,
      notes,
    });
    if (!result.success) {
      setError(firstIssueMessage(result.error));
      return;
    }
    setError(null);
    onSubmit(result.data);
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Tipul mesei</legend>
        <FilterChips
          label="Tipul mesei"
          options={MEAL_ORDER.map((type) => ({ id: type, label: MEAL_TYPE_LABEL[type] }))}
          value={mealType}
          onChange={setMealType}
        />
      </fieldset>

      <div className="space-y-2">
        <label htmlFor={`${ids}-description`} className="text-sm font-medium">
          Ce a mâncat?
        </label>
        <textarea
          id={`${ids}-description`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={300}
          rows={2}
          placeholder="De exemplu: omletă cu legume și o felie de pâine"
          className={fieldClass}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Grupe alimentare</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {FOOD_GROUPS.map((group) => {
            const checked = foodGroups.includes(group);
            return (
              <label
                key={group}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors duration-150",
                  checked ? "border-foreground bg-muted" : "border-border hover:bg-muted/60",
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleGroup(group)}
                  className="size-4 accent-foreground"
                />
                {FOOD_GROUP_LABEL[group]}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="space-y-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={hadReaction}
            onChange={(event) => setHadReaction(event.target.checked)}
            className="size-4 accent-foreground"
          />
          A avut o reacție după masă?
        </label>
        {hadReaction ? (
          <div className="space-y-2">
            <label htmlFor={`${ids}-reaction`} className="text-sm text-muted-foreground">
              Descrieți reacția (ce, când a apărut, cât a durat)
            </label>
            <textarea
              id={`${ids}-reaction`}
              value={reactionNotes}
              onChange={(event) => setReactionNotes(event.target.value)}
              maxLength={500}
              rows={2}
              className={fieldClass}
            />
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor={`${ids}-notes`} className="text-sm font-medium">
          Note <span className="font-normal text-muted-foreground">(opțional)</span>
        </label>
        <textarea
          id={`${ids}-notes`}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={500}
          rows={2}
          className={fieldClass}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </form>
  );
}
