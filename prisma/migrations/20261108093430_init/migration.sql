-- CreateEnum
CREATE TYPE "profile_relationship_type" AS ENUM ('PARENT', 'LEGAL_GUARDIAN', 'CAREGIVER', 'FAMILY_MEMBER', 'OTHER');

-- CreateEnum
CREATE TYPE "triage_session_status" AS ENUM ('ACTIVE', 'COMPLETED', 'ESCALATED_TO_DOCTOR');

-- CreateEnum
CREATE TYPE "chat_message_sender" AS ENUM ('PROFILE', 'AI');

-- CreateEnum
CREATE TYPE "medical_event_severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "medical_event_source" AS ENUM ('PROFILE', 'DOCTOR', 'AI_TRIAGE');

-- CreateEnum
CREATE TYPE "consultation_status" AS ENUM ('REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "currency" AS ENUM ('RON');

-- CreateTable
CREATE TABLE "profile_spaces" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "profile_spaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_profiles" (
    "id" UUID NOT NULL,
    "profile_space_id" UUID NOT NULL,
    "first_name" VARCHAR(50) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "allergies" TEXT,
    "chronic_conditions" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "patient_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_relationships" (
    "id" UUID NOT NULL,
    "manager_profile_id" UUID NOT NULL,
    "patient_profile_id" UUID NOT NULL,
    "type" "profile_relationship_type" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_profiles" (
    "id" UUID NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "license_number" VARCHAR(50),
    "specialty" VARCHAR(100),
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "price_per_consultation" DECIMAL(10,2) NOT NULL,
    "currency" "currency" NOT NULL DEFAULT 'RON',
    "bio" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "triage_sessions" (
    "id" UUID NOT NULL,
    "patient_profile_id" UUID NOT NULL,
    "started_by_profile_id" UUID NOT NULL,
    "status" "triage_session_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "triage_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "triage_messages" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "sender" "chat_message_sender" NOT NULL,
    "sender_profile_id" UUID,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "triage_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_timeline_events" (
    "id" UUID NOT NULL,
    "patient_profile_id" UUID NOT NULL,
    "recorded_by_profile_id" UUID,
    "doctor_profile_id" UUID,
    "source_session_id" UUID,
    "source" "medical_event_source" NOT NULL,
    "symptom" VARCHAR(150) NOT NULL,
    "severity" "medical_event_severity" NOT NULL DEFAULT 'MEDIUM',
    "summary" TEXT,
    "recorded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medical_timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultations" (
    "id" UUID NOT NULL,
    "patient_profile_id" UUID NOT NULL,
    "requested_by_profile_id" UUID NOT NULL,
    "doctor_profile_id" UUID,
    "triage_session_id" UUID,
    "status" "consultation_status" NOT NULL DEFAULT 'REQUESTED',
    "total_fee" DECIMAL(10,2) NOT NULL,
    "platform_commission" DECIMAL(10,2) NOT NULL,
    "currency" "currency" NOT NULL DEFAULT 'RON',
    "started_at" TIMESTAMPTZ(6),
    "ended_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "consultations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_profiles_profile_space_id_last_name_first_name_idx" ON "patient_profiles"("profile_space_id", "last_name", "first_name");

-- CreateIndex
CREATE INDEX "patient_profiles_date_of_birth_idx" ON "patient_profiles"("date_of_birth");

-- CreateIndex
CREATE INDEX "profile_relationships_patient_profile_id_idx" ON "profile_relationships"("patient_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "profile_relationships_manager_profile_id_patient_profile_id_key" ON "profile_relationships"("manager_profile_id", "patient_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_profiles_license_number_key" ON "doctor_profiles"("license_number");

-- CreateIndex
CREATE INDEX "doctor_profiles_is_verified_is_online_idx" ON "doctor_profiles"("is_verified", "is_online");

-- CreateIndex
CREATE INDEX "triage_sessions_patient_profile_id_created_at_idx" ON "triage_sessions"("patient_profile_id", "created_at");

-- CreateIndex
CREATE INDEX "triage_sessions_started_by_profile_id_created_at_idx" ON "triage_sessions"("started_by_profile_id", "created_at");

-- CreateIndex
CREATE INDEX "triage_messages_session_id_created_at_idx" ON "triage_messages"("session_id", "created_at");

-- CreateIndex
CREATE INDEX "medical_timeline_events_patient_profile_id_recorded_at_idx" ON "medical_timeline_events"("patient_profile_id", "recorded_at");

-- CreateIndex
CREATE INDEX "medical_timeline_events_recorded_by_profile_id_idx" ON "medical_timeline_events"("recorded_by_profile_id");

-- CreateIndex
CREATE INDEX "consultations_patient_profile_id_created_at_idx" ON "consultations"("patient_profile_id", "created_at");

-- CreateIndex
CREATE INDEX "consultations_requested_by_profile_id_created_at_idx" ON "consultations"("requested_by_profile_id", "created_at");

-- CreateIndex
CREATE INDEX "consultations_doctor_profile_id_created_at_idx" ON "consultations"("doctor_profile_id", "created_at");

-- AddForeignKey
ALTER TABLE "patient_profiles" ADD CONSTRAINT "patient_profiles_profile_space_id_fkey" FOREIGN KEY ("profile_space_id") REFERENCES "profile_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_relationships" ADD CONSTRAINT "profile_relationships_manager_profile_id_fkey" FOREIGN KEY ("manager_profile_id") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_relationships" ADD CONSTRAINT "profile_relationships_patient_profile_id_fkey" FOREIGN KEY ("patient_profile_id") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triage_sessions" ADD CONSTRAINT "triage_sessions_patient_profile_id_fkey" FOREIGN KEY ("patient_profile_id") REFERENCES "patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triage_sessions" ADD CONSTRAINT "triage_sessions_started_by_profile_id_fkey" FOREIGN KEY ("started_by_profile_id") REFERENCES "patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triage_messages" ADD CONSTRAINT "triage_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "triage_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triage_messages" ADD CONSTRAINT "triage_messages_sender_profile_id_fkey" FOREIGN KEY ("sender_profile_id") REFERENCES "patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_timeline_events" ADD CONSTRAINT "medical_timeline_events_patient_profile_id_fkey" FOREIGN KEY ("patient_profile_id") REFERENCES "patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_timeline_events" ADD CONSTRAINT "medical_timeline_events_recorded_by_profile_id_fkey" FOREIGN KEY ("recorded_by_profile_id") REFERENCES "patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_timeline_events" ADD CONSTRAINT "medical_timeline_events_doctor_profile_id_fkey" FOREIGN KEY ("doctor_profile_id") REFERENCES "doctor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_timeline_events" ADD CONSTRAINT "medical_timeline_events_source_session_id_fkey" FOREIGN KEY ("source_session_id") REFERENCES "triage_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_patient_profile_id_fkey" FOREIGN KEY ("patient_profile_id") REFERENCES "patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_requested_by_profile_id_fkey" FOREIGN KEY ("requested_by_profile_id") REFERENCES "patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_doctor_profile_id_fkey" FOREIGN KEY ("doctor_profile_id") REFERENCES "doctor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_triage_session_id_fkey" FOREIGN KEY ("triage_session_id") REFERENCES "triage_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
