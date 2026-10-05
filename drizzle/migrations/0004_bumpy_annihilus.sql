CREATE TABLE "profile_photo" (
	"id" serial PRIMARY KEY NOT NULL,
	"data" "bytea" NOT NULL,
	"content_type" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
