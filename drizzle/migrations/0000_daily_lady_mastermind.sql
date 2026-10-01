CREATE TABLE "profile" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"title_en" text NOT NULL,
	"title_sv" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"location_en" text NOT NULL,
	"location_sv" text NOT NULL,
	"github" text,
	"linkedin" text,
	"photo_url" text,
	"available" boolean DEFAULT true NOT NULL,
	"bio_en" text NOT NULL,
	"bio_sv" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "section" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"label_en" text NOT NULL,
	"label_sv" text NOT NULL,
	"display_type" text DEFAULT 'entries' NOT NULL,
	"sort_order" integer NOT NULL,
	CONSTRAINT "section_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "section_item" (
	"id" serial PRIMARY KEY NOT NULL,
	"section_id" integer NOT NULL,
	"title_en" text NOT NULL,
	"title_sv" text NOT NULL,
	"subtitle_en" text,
	"subtitle_sv" text,
	"start_date" date,
	"end_date" date,
	"link" text,
	"description_en" text,
	"description_sv" text,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "section_item" ADD CONSTRAINT "section_item_section_id_section_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."section"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "section_item_section_idx" ON "section_item" USING btree ("section_id","sort_order");