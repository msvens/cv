CREATE TABLE "letter" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"language" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"include_contact" boolean DEFAULT false NOT NULL,
	"include_recipient" boolean DEFAULT false NOT NULL,
	"recipient_contact_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "letter_application_id_unique" UNIQUE("application_id")
);
--> statement-breakpoint
ALTER TABLE "letter" ADD CONSTRAINT "letter_application_id_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letter" ADD CONSTRAINT "letter_recipient_contact_id_application_contact_id_fk" FOREIGN KEY ("recipient_contact_id") REFERENCES "public"."application_contact"("id") ON DELETE set null ON UPDATE no action;