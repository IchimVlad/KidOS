-- AlterTable
ALTER TABLE "patient_profiles" ADD COLUMN "blood_type" VARCHAR(20),
ADD COLUMN "past_surgeries" TEXT,
ADD COLUMN "vaccination_status" TEXT,
ADD COLUMN "emergency_contact_name" VARCHAR(100),
ADD COLUMN "emergency_contact_phone" VARCHAR(30);
