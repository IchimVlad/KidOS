/*
  Warnings:

  - Added the required column `event_type` to the `medical_timeline_events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `medical_timeline_events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sex` to the `patient_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "patient_sex" AS ENUM ('FEMALE', 'MALE');

-- CreateEnum
CREATE TYPE "info_source" AS ENUM ('DECLARED', 'CONSULTATION');

-- CreateEnum
CREATE TYPE "timeline_event_type" AS ENUM ('CONSULTATION', 'OBSERVATION', 'ANALYSIS', 'VACCINATION', 'TREATMENT_CHANGE');

-- CreateEnum
CREATE TYPE "document_type" AS ENUM ('ANALYSIS', 'LETTER', 'DISCHARGE', 'OTHER');

-- CreateEnum
CREATE TYPE "consultation_message_sender" AS ENUM ('PATIENT', 'DOCTOR');

-- CreateEnum
CREATE TYPE "message_delivery_status" AS ENUM ('PENDING', 'SENT');

-- AlterTable
ALTER TABLE "medical_timeline_events" ADD COLUMN "detail" TEXT,
ADD COLUMN "event_type" "timeline_event_type",
ADD COLUMN "title" VARCHAR(150);

UPDATE "medical_timeline_events"
SET
  "title" = COALESCE(NULLIF(BTRIM("symptom"), ''), 'Eveniment medical'),
  "event_type" = CASE
    WHEN "source" = 'DOCTOR' THEN 'CONSULTATION'::"timeline_event_type"
    WHEN "source" = 'AI_TRIAGE' THEN 'OBSERVATION'::"timeline_event_type"
    ELSE 'OBSERVATION'::"timeline_event_type"
  END
WHERE "title" IS NULL OR "event_type" IS NULL;

ALTER TABLE "medical_timeline_events"
  ALTER COLUMN "event_type" SET NOT NULL,
  ALTER COLUMN "title" SET NOT NULL;

-- AlterTable
ALTER TABLE "patient_profiles" ADD COLUMN "attending_doctors" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "current_treatments" TEXT,
ADD COLUMN "family_doctor" VARCHAR(150),
ADD COLUMN "insurance" VARCHAR(150),
ADD COLUMN "notes" TEXT,
ADD COLUMN "preferred_name" VARCHAR(50),
ADD COLUMN "sex" "patient_sex";

UPDATE "patient_profiles" SET "sex" = 'MALE'::"patient_sex" WHERE "sex" IS NULL;

ALTER TABLE "patient_profiles" ALTER COLUMN "sex" SET NOT NULL;

-- CreateTable
CREATE TABLE "measurements" (
    "id" UUID NOT NULL,
    "patient_profile_id" UUID NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "value" VARCHAR(50),
    "unit" VARCHAR(30),
    "recorded_at" TIMESTAMPTZ(6) NOT NULL,
    "source" "info_source" NOT NULL DEFAULT 'DECLARED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_documents" (
    "id" UUID NOT NULL,
    "patient_profile_id" UUID NOT NULL,
    "timeline_event_id" UUID,
    "title" VARCHAR(150) NOT NULL,
    "type" "document_type" NOT NULL,
    "date" DATE NOT NULL,
    "preview" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medical_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" UUID NOT NULL,
    "patient_profile_id" UUID NOT NULL,
    "timeline_event_id" UUID,
    "title" VARCHAR(150) NOT NULL,
    "date" DATE NOT NULL,
    "doctor_name" VARCHAR(100) NOT NULL,
    "instructions" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultation_messages" (
    "id" UUID NOT NULL,
    "consultation_id" UUID NOT NULL,
    "sender" "consultation_message_sender" NOT NULL,
    "content" TEXT NOT NULL,
    "delivery" "message_delivery_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "measurements_patient_profile_id_recorded_at_idx" ON "measurements"("patient_profile_id", "recorded_at");

-- CreateIndex
CREATE INDEX "medical_documents_patient_profile_id_date_idx" ON "medical_documents"("patient_profile_id", "date");

-- CreateIndex
CREATE INDEX "medical_documents_timeline_event_id_idx" ON "medical_documents"("timeline_event_id");

-- CreateIndex
CREATE INDEX "prescriptions_patient_profile_id_date_idx" ON "prescriptions"("patient_profile_id", "date");

-- CreateIndex
CREATE INDEX "prescriptions_timeline_event_id_idx" ON "prescriptions"("timeline_event_id");

-- CreateIndex
CREATE INDEX "consultation_messages_consultation_id_created_at_idx" ON "consultation_messages"("consultation_id", "created_at");

-- AddForeignKey
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_patient_profile_id_fkey" FOREIGN KEY ("patient_profile_id") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_documents" ADD CONSTRAINT "medical_documents_patient_profile_id_fkey" FOREIGN KEY ("patient_profile_id") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_documents" ADD CONSTRAINT "medical_documents_timeline_event_id_fkey" FOREIGN KEY ("timeline_event_id") REFERENCES "medical_timeline_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patient_profile_id_fkey" FOREIGN KEY ("patient_profile_id") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_timeline_event_id_fkey" FOREIGN KEY ("timeline_event_id") REFERENCES "medical_timeline_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_messages" ADD CONSTRAINT "consultation_messages_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
