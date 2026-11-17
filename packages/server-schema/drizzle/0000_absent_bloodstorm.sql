CREATE TYPE "public"."user_role" AS ENUM('admin', 'senior', 'teen_child', 'caregiver_guest');--> statement-breakpoint
CREATE TYPE "public"."account_type" AS ENUM('shared_checking', 'personal_allowance', 'sinking_fund');--> statement-breakpoint
CREATE TYPE "public"."bill_status" AS ENUM('detected', 'pending_review', 'approved', 'paid');--> statement-breakpoint
CREATE TYPE "public"."bill_type" AS ENUM('electricity', 'water', 'internet', 'mobile_plan', 'other');--> statement-breakpoint
CREATE TYPE "public"."transaction_source" AS ENUM('manual', 'android_push', 'bank_webhook', 'bill_ocr');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('income', 'expense', 'transfer');--> statement-breakpoint
CREATE TYPE "public"."allergy_severity" AS ENUM('mild', 'moderate', 'critical');--> statement-breakpoint
CREATE TYPE "public"."medication_status" AS ENUM('taken', 'skipped', 'snoozed', 'missed_escalated');--> statement-breakpoint
CREATE TYPE "public"."shift_status" AS ENUM('scheduled', 'in_progress', 'completed', 'swapped', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."vital_type" AS ENUM('blood_pressure', 'blood_glucose', 'heart_rate', 'temperature', 'weight');--> statement-breakpoint
CREATE TYPE "public"."break_glass_status" AS ENUM('pending_cooldown', 'approved', 'vetoed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."vault_category" AS ENUM('national_id', 'insurance', 'property_deed', 'medical_directive', 'emergency_credential');--> statement-breakpoint
CREATE TYPE "public"."aisle_category" AS ENUM('produce', 'dairy', 'meat_seafood', 'bakery', 'pantry', 'frozen', 'household');--> statement-breakpoint
CREATE TABLE "household_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "user_role" DEFAULT 'teen_child' NOT NULL,
	"display_name" varchar(80),
	"is_emergency_contact" boolean DEFAULT false NOT NULL,
	"valid_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_household_user" UNIQUE("household_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "household_modules" (
	"household_id" uuid PRIMARY KEY NOT NULL,
	"finance_enabled" boolean DEFAULT true NOT NULL,
	"health_enabled" boolean DEFAULT true NOT NULL,
	"vault_enabled" boolean DEFAULT true NOT NULL,
	"daily_ops_enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "households" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255),
	"phone_number" varchar(30),
	"full_name" varchar(120) NOT NULL,
	"avatar_url" varchar(2048),
	"public_key_x25519" varchar(256),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
CREATE TABLE "finance_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"account_type" "account_type" DEFAULT 'shared_checking' NOT NULL,
	"balance_cents" bigint DEFAULT 0 NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"owner_member_id" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"amount_cents" bigint NOT NULL,
	"transaction_type" "transaction_type" NOT NULL,
	"category" varchar(60) NOT NULL,
	"description" text,
	"transaction_date" date DEFAULT now() NOT NULL,
	"source" "transaction_source" DEFAULT 'manual' NOT NULL,
	"receipt_url" text,
	"created_by_member_id" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "utility_bills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"provider_name" varchar(120) NOT NULL,
	"bill_type" "bill_type" NOT NULL,
	"billing_period_start" date,
	"billing_period_end" date,
	"amount_cents" bigint NOT NULL,
	"due_date" date NOT NULL,
	"status" "bill_status" DEFAULT 'detected' NOT NULL,
	"raw_invoice_url" text,
	"ocr_metadata" jsonb DEFAULT '{}'::jsonb,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "caregiver_shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"patient_member_id" uuid NOT NULL,
	"assigned_member_id" uuid NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"status" "shift_status" DEFAULT 'scheduled' NOT NULL,
	"notes" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medical_allergies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"allergen" varchar(100) NOT NULL,
	"severity" "allergy_severity" DEFAULT 'critical' NOT NULL,
	"reaction_description" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medication_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"medication_id" uuid NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"taken_at" timestamp with time zone,
	"status" "medication_status" DEFAULT 'taken' NOT NULL,
	"photo_proof_url" text,
	"recorded_by_member_id" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"patient_member_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"dosage" varchar(80) NOT NULL,
	"instructions" text,
	"schedule_cron" varchar(50) NOT NULL,
	"remaining_pills" integer DEFAULT 0 NOT NULL,
	"refill_threshold" integer DEFAULT 5 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vitals_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"vital_type" "vital_type" NOT NULL,
	"value_primary" numeric(6, 2) NOT NULL,
	"value_secondary" numeric(6, 2),
	"unit" varchar(20) NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_renewals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"asset_name" varchar(120) NOT NULL,
	"renewal_date" date NOT NULL,
	"notification_lead_days" integer DEFAULT 30 NOT NULL,
	"notes" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "break_glass_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"requester_user_id" uuid NOT NULL,
	"status" "break_glass_status" DEFAULT 'pending_cooldown' NOT NULL,
	"reason" text NOT NULL,
	"cooldown_expires_at" timestamp with time zone NOT NULL,
	"vetoed_by_user_id" uuid,
	"veto_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "home_wiki_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"title" varchar(150) NOT NULL,
	"content_markdown" text NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "household_vault_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"encrypted_kek" text NOT NULL,
	"kek_salt" varchar(64) NOT NULL,
	"kek_nonce" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_vault_key" UNIQUE("household_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "vault_escrow_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"recipient_user_id" uuid NOT NULL,
	"encrypted_kek_share" text NOT NULL,
	"ephemeral_public_key" text NOT NULL,
	"nonce" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_escrow_share" UNIQUE("household_id","recipient_user_id")
);
--> statement-breakpoint
CREATE TABLE "vault_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"title" varchar(150) NOT NULL,
	"category" "vault_category" NOT NULL,
	"encrypted_payload" text NOT NULL,
	"payload_nonce" varchar(64) NOT NULL,
	"encrypted_dek" text NOT NULL,
	"dek_nonce" varchar(64) NOT NULL,
	"key_version" integer DEFAULT 1 NOT NULL,
	"created_by_member_id" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"title" varchar(120) NOT NULL,
	"assigned_member_id" uuid,
	"recurrence_rule" varchar(50),
	"reward_points" integer DEFAULT 0 NOT NULL,
	"allowance_cents" bigint DEFAULT 0 NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"verified_by_admin" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grocery_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"quantity" varchar(50) DEFAULT '1' NOT NULL,
	"aisle_category" "aisle_category" DEFAULT 'pantry' NOT NULL,
	"is_checked" boolean DEFAULT false NOT NULL,
	"checked_by_member_id" uuid,
	"checked_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"planned_date" date NOT NULL,
	"meal_type" varchar(20) NOT NULL,
	"recipe_title" varchar(120) NOT NULL,
	"notes" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_changes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"household_id" uuid NOT NULL,
	"entity_table" varchar(80) NOT NULL,
	"entity_id" uuid NOT NULL,
	"operation" varchar(10) NOT NULL,
	"record_payload" jsonb,
	"hlc_timestamp" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"action" varchar(80) NOT NULL,
	"target_resource" varchar(80) NOT NULL,
	"target_id" uuid,
	"details_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip_address" varchar(45),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_modules" ADD CONSTRAINT "household_modules_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_accounts" ADD CONSTRAINT "finance_accounts_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_accounts" ADD CONSTRAINT "finance_accounts_owner_member_id_household_members_id_fk" FOREIGN KEY ("owner_member_id") REFERENCES "public"."household_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_transactions" ADD CONSTRAINT "finance_transactions_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_transactions" ADD CONSTRAINT "finance_transactions_account_id_finance_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."finance_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_transactions" ADD CONSTRAINT "finance_transactions_created_by_member_id_household_members_id_fk" FOREIGN KEY ("created_by_member_id") REFERENCES "public"."household_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_bills" ADD CONSTRAINT "utility_bills_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "caregiver_shifts" ADD CONSTRAINT "caregiver_shifts_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "caregiver_shifts" ADD CONSTRAINT "caregiver_shifts_patient_member_id_household_members_id_fk" FOREIGN KEY ("patient_member_id") REFERENCES "public"."household_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "caregiver_shifts" ADD CONSTRAINT "caregiver_shifts_assigned_member_id_household_members_id_fk" FOREIGN KEY ("assigned_member_id") REFERENCES "public"."household_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_allergies" ADD CONSTRAINT "medical_allergies_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_allergies" ADD CONSTRAINT "medical_allergies_member_id_household_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."household_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication_logs" ADD CONSTRAINT "medication_logs_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication_logs" ADD CONSTRAINT "medication_logs_medication_id_medications_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication_logs" ADD CONSTRAINT "medication_logs_recorded_by_member_id_household_members_id_fk" FOREIGN KEY ("recorded_by_member_id") REFERENCES "public"."household_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medications" ADD CONSTRAINT "medications_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medications" ADD CONSTRAINT "medications_patient_member_id_household_members_id_fk" FOREIGN KEY ("patient_member_id") REFERENCES "public"."household_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vitals_logs" ADD CONSTRAINT "vitals_logs_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vitals_logs" ADD CONSTRAINT "vitals_logs_member_id_household_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."household_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_renewals" ADD CONSTRAINT "asset_renewals_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "break_glass_requests" ADD CONSTRAINT "break_glass_requests_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "break_glass_requests" ADD CONSTRAINT "break_glass_requests_requester_user_id_users_id_fk" FOREIGN KEY ("requester_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "break_glass_requests" ADD CONSTRAINT "break_glass_requests_vetoed_by_user_id_users_id_fk" FOREIGN KEY ("vetoed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "home_wiki_cards" ADD CONSTRAINT "home_wiki_cards_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_vault_keys" ADD CONSTRAINT "household_vault_keys_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_vault_keys" ADD CONSTRAINT "household_vault_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vault_escrow_shares" ADD CONSTRAINT "vault_escrow_shares_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vault_escrow_shares" ADD CONSTRAINT "vault_escrow_shares_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vault_items" ADD CONSTRAINT "vault_items_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vault_items" ADD CONSTRAINT "vault_items_created_by_member_id_household_members_id_fk" FOREIGN KEY ("created_by_member_id") REFERENCES "public"."household_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chores" ADD CONSTRAINT "chores_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chores" ADD CONSTRAINT "chores_assigned_member_id_household_members_id_fk" FOREIGN KEY ("assigned_member_id") REFERENCES "public"."household_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grocery_items" ADD CONSTRAINT "grocery_items_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grocery_items" ADD CONSTRAINT "grocery_items_checked_by_member_id_household_members_id_fk" FOREIGN KEY ("checked_by_member_id") REFERENCES "public"."household_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_changes" ADD CONSTRAINT "sync_changes_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_sync_changes_cursor" ON "sync_changes" USING btree ("household_id","id");