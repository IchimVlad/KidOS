-- CreateEnum
CREATE TYPE "medical_extraction_status" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "medical_extraction_proposals" (
    "id" UUID NOT NULL,
    "consultation_id" UUID NOT NULL,
    "patient_profile_id" UUID NOT NULL,
    "proposed_data" JSONB NOT NULL,
    "status" "medical_extraction_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMPTZ(6),

    CONSTRAINT "medical_extraction_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medical_extraction_proposals_consultation_id_status_created_at_idx" ON "medical_extraction_proposals"("consultation_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "medical_extraction_proposals_patient_profile_id_status_idx" ON "medical_extraction_proposals"("patient_profile_id", "status");

-- AddForeignKey
ALTER TABLE "medical_extraction_proposals" ADD CONSTRAINT "medical_extraction_proposals_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_extraction_proposals" ADD CONSTRAINT "medical_extraction_proposals_patient_profile_id_fkey" FOREIGN KEY ("patient_profile_id") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
