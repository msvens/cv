CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"attention_days" integer DEFAULT 7 NOT NULL,
	CONSTRAINT "settings_single_row" CHECK ("settings"."id" = 1)
);
