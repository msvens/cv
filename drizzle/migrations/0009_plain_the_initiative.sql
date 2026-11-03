CREATE TABLE "application_snapshot" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"kind" text NOT NULL,
	"language" text NOT NULL,
	"filename" text NOT NULL,
	"data" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "letter" ADD COLUMN "attach_cv" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "application_snapshot" ADD CONSTRAINT "application_snapshot_application_id_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "application_snapshot_application_idx" ON "application_snapshot" USING btree ("application_id");