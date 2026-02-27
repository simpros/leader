CREATE TABLE "account" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"logo" text,
	"created_at" timestamp NOT NULL,
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	"active_organization_id" text
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project" (
	"id" text PRIMARY KEY,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "project_custom_field" (
	"id" text PRIMARY KEY,
	"organization_id" text NOT NULL,
	"project_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_custom_field" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "lead" (
	"id" text PRIMARY KEY,
	"organization_id" text NOT NULL,
	"place_id" text NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"types" text,
	"website" text,
	"email" text,
	"email_source" text,
	"phone" text,
	"rating" real,
	"ratings_total" integer,
	"google_maps_url" text,
	"business_status" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lead" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "lead_custom_field_value" (
	"id" text PRIMARY KEY,
	"organization_id" text NOT NULL,
	"lead_id" text NOT NULL,
	"project_custom_field_id" text NOT NULL,
	"value" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lead_custom_field_value" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "project_lead" (
	"id" text PRIMARY KEY,
	"organization_id" text NOT NULL,
	"project_id" text NOT NULL,
	"lead_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_lead" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "initiative" (
	"id" text PRIMARY KEY,
	"organization_id" text NOT NULL,
	"project_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"subject" text NOT NULL,
	"html_body" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "initiative" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "initiative_conversation" (
	"id" text PRIMARY KEY,
	"organization_id" text NOT NULL,
	"initiative_lead_id" text NOT NULL,
	"direction" text NOT NULL,
	"subject" text,
	"html_body" text NOT NULL,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "initiative_conversation" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "initiative_lead" (
	"id" text PRIMARY KEY,
	"organization_id" text NOT NULL,
	"initiative_id" text NOT NULL,
	"lead_id" text NOT NULL,
	"status" text NOT NULL,
	"last_email_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "initiative_lead" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" ("user_id");--> statement-breakpoint
CREATE INDEX "invitation_organizationId_idx" ON "invitation" ("organization_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" ("email");--> statement-breakpoint
CREATE INDEX "member_organizationId_idx" ON "member" ("organization_id");--> statement-breakpoint
CREATE INDEX "member_userId_idx" ON "member" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_slug_uidx" ON "organization" ("slug");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
CREATE INDEX "project_userId_idx" ON "project" ("user_id");--> statement-breakpoint
CREATE INDEX "project_organizationId_idx" ON "project" ("organization_id");--> statement-breakpoint
CREATE INDEX "projectCustomField_projectId_idx" ON "project_custom_field" ("project_id");--> statement-breakpoint
CREATE INDEX "projectCustomField_organizationId_idx" ON "project_custom_field" ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "projectCustomField_project_name_uidx" ON "project_custom_field" ("project_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "lead_org_placeId_uidx" ON "lead" ("organization_id","place_id");--> statement-breakpoint
CREATE INDEX "lead_organizationId_idx" ON "lead" ("organization_id");--> statement-breakpoint
CREATE INDEX "leadCustomFieldValue_leadId_idx" ON "lead_custom_field_value" ("lead_id");--> statement-breakpoint
CREATE INDEX "leadCustomFieldValue_projectCustomFieldId_idx" ON "lead_custom_field_value" ("project_custom_field_id");--> statement-breakpoint
CREATE INDEX "leadCustomFieldValue_organizationId_idx" ON "lead_custom_field_value" ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "leadCustomFieldValue_lead_field_uidx" ON "lead_custom_field_value" ("lead_id","project_custom_field_id");--> statement-breakpoint
CREATE INDEX "projectLead_projectId_idx" ON "project_lead" ("project_id");--> statement-breakpoint
CREATE INDEX "projectLead_leadId_idx" ON "project_lead" ("lead_id");--> statement-breakpoint
CREATE INDEX "projectLead_organizationId_idx" ON "project_lead" ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "projectLead_project_lead_uidx" ON "project_lead" ("project_id","lead_id");--> statement-breakpoint
CREATE INDEX "initiative_projectId_idx" ON "initiative" ("project_id");--> statement-breakpoint
CREATE INDEX "initiative_organizationId_idx" ON "initiative" ("organization_id");--> statement-breakpoint
CREATE INDEX "initiativeConversation_initiativeLeadId_idx" ON "initiative_conversation" ("initiative_lead_id");--> statement-breakpoint
CREATE INDEX "initiativeConversation_organizationId_idx" ON "initiative_conversation" ("organization_id");--> statement-breakpoint
CREATE INDEX "initiativeLead_initiativeId_idx" ON "initiative_lead" ("initiative_id");--> statement-breakpoint
CREATE INDEX "initiativeLead_leadId_idx" ON "initiative_lead" ("lead_id");--> statement-breakpoint
CREATE INDEX "initiativeLead_organizationId_idx" ON "initiative_lead" ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "initiativeLead_initiative_lead_uidx" ON "initiative_lead" ("initiative_id","lead_id");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "project_custom_field" ADD CONSTRAINT "project_custom_field_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "project_custom_field" ADD CONSTRAINT "project_custom_field_project_id_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "lead_custom_field_value" ADD CONSTRAINT "lead_custom_field_value_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "lead_custom_field_value" ADD CONSTRAINT "lead_custom_field_value_lead_id_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lead"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "lead_custom_field_value" ADD CONSTRAINT "lead_custom_field_value_fVkCsfLFeGcj_fkey" FOREIGN KEY ("project_custom_field_id") REFERENCES "project_custom_field"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "project_lead" ADD CONSTRAINT "project_lead_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "project_lead" ADD CONSTRAINT "project_lead_project_id_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "project_lead" ADD CONSTRAINT "project_lead_lead_id_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lead"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "initiative" ADD CONSTRAINT "initiative_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "initiative" ADD CONSTRAINT "initiative_project_id_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "initiative_conversation" ADD CONSTRAINT "initiative_conversation_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "initiative_conversation" ADD CONSTRAINT "initiative_conversation_C7jRI4M6GKoy_fkey" FOREIGN KEY ("initiative_lead_id") REFERENCES "initiative_lead"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "initiative_lead" ADD CONSTRAINT "initiative_lead_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "initiative_lead" ADD CONSTRAINT "initiative_lead_initiative_id_initiative_id_fkey" FOREIGN KEY ("initiative_id") REFERENCES "initiative"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "initiative_lead" ADD CONSTRAINT "initiative_lead_lead_id_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lead"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "project_org_policy" ON "project" AS PERMISSIVE FOR ALL TO public USING ("project"."organization_id" = current_setting('app.current_org_id', true));--> statement-breakpoint
CREATE POLICY "projectCustomField_org_policy" ON "project_custom_field" AS PERMISSIVE FOR ALL TO public USING ("project_custom_field"."organization_id" = current_setting('app.current_org_id', true));--> statement-breakpoint
CREATE POLICY "lead_org_policy" ON "lead" AS PERMISSIVE FOR ALL TO public USING ("lead"."organization_id" = current_setting('app.current_org_id', true));--> statement-breakpoint
CREATE POLICY "leadCustomFieldValue_org_policy" ON "lead_custom_field_value" AS PERMISSIVE FOR ALL TO public USING ("lead_custom_field_value"."organization_id" = current_setting('app.current_org_id', true));--> statement-breakpoint
CREATE POLICY "projectLead_org_policy" ON "project_lead" AS PERMISSIVE FOR ALL TO public USING ("project_lead"."organization_id" = current_setting('app.current_org_id', true));--> statement-breakpoint
CREATE POLICY "initiative_org_policy" ON "initiative" AS PERMISSIVE FOR ALL TO public USING ("initiative"."organization_id" = current_setting('app.current_org_id', true));--> statement-breakpoint
CREATE POLICY "initiativeConversation_org_policy" ON "initiative_conversation" AS PERMISSIVE FOR ALL TO public USING ("initiative_conversation"."organization_id" = current_setting('app.current_org_id', true));--> statement-breakpoint
CREATE POLICY "initiativeLead_org_policy" ON "initiative_lead" AS PERMISSIVE FOR ALL TO public USING ("initiative_lead"."organization_id" = current_setting('app.current_org_id', true));