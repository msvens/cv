ALTER TABLE "application" ADD COLUMN "language" text DEFAULT 'en' NOT NULL;--> statement-breakpoint
-- The language moves from the letter to its application: keep each existing letter's.
UPDATE "application" SET "language" = "letter"."language" FROM "letter" WHERE "letter"."application_id" = "application"."id";--> statement-breakpoint
ALTER TABLE "letter" DROP COLUMN "language";
