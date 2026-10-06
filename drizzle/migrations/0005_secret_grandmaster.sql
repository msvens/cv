CREATE TABLE "application" (
	"id" serial PRIMARY KEY NOT NULL,
	"company" text NOT NULL,
	"role" text NOT NULL,
	"status" text DEFAULT 'not_applied' NOT NULL,
	"ad_url" text,
	"ad_text" text,
	"location" text,
	"deadline" date,
	"applied_on" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_status_change" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"status" text NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "application_status_change" ADD CONSTRAINT "application_status_change_application_id_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "application_status_change_application_idx" ON "application_status_change" USING btree ("application_id");