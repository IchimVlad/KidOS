-- CreateEnum
CREATE TYPE "meal_type" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');

-- CreateEnum
CREATE TYPE "food_group" AS ENUM ('VEGETABLES', 'FRUITS', 'GRAINS', 'PROTEIN', 'DAIRY', 'FATS', 'SWEETS');

-- CreateTable
CREATE TABLE "nutrition_entries" (
    "id" UUID NOT NULL,
    "patient_profile_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "meal_type" "meal_type" NOT NULL,
    "description" VARCHAR(300) NOT NULL,
    "food_groups" "food_group"[] DEFAULT ARRAY[]::"food_group"[],
    "had_reaction" BOOLEAN NOT NULL DEFAULT false,
    "reaction_notes" VARCHAR(500),
    "notes" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "nutrition_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hydration_logs" (
    "id" UUID NOT NULL,
    "patient_profile_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "amount_ml" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "hydration_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "nutrition_entries_patient_profile_id_date_idx" ON "nutrition_entries"("patient_profile_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "hydration_logs_patient_profile_id_date_key" ON "hydration_logs"("patient_profile_id", "date");

-- AddForeignKey
ALTER TABLE "nutrition_entries" ADD CONSTRAINT "nutrition_entries_patient_profile_id_fkey" FOREIGN KEY ("patient_profile_id") REFERENCES "patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hydration_logs" ADD CONSTRAINT "hydration_logs_patient_profile_id_fkey" FOREIGN KEY ("patient_profile_id") REFERENCES "patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
