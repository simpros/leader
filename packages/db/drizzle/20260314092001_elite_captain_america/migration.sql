CREATE TABLE "organization_smtp_config" (
	"id" text PRIMARY KEY,
	"organization_id" text NOT NULL,
	"smtp_host" text NOT NULL,
	"smtp_port" integer NOT NULL,
	"smtp_user" text NOT NULL,
	"smtp_pass" text NOT NULL,
	"email_from" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization_smtp_config" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "organizationSmtpConfig_organizationId_uidx" ON "organization_smtp_config" ("organization_id");--> statement-breakpoint
ALTER TABLE "organization_smtp_config" ADD CONSTRAINT "organization_smtp_config_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "organizationSmtpConfig_org_policy" ON "organization_smtp_config" AS PERMISSIVE FOR ALL TO public USING ("organization_smtp_config"."organization_id" = current_setting('app.current_org_id', true));