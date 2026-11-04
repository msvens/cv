import { sql } from 'drizzle-orm';
import {
	check,
	customType,
	pgTable,
	serial,
	text,
	integer,
	timestamp,
	boolean,
	date,
	index
} from 'drizzle-orm/pg-core';

export const profile = pgTable('profile', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	titleEn: text('title_en').notNull(),
	titleSv: text('title_sv').notNull(),
	email: text('email').notNull(),
	phone: text('phone'),
	locationEn: text('location_en').notNull(),
	locationSv: text('location_sv').notNull(),
	github: text('github'),
	linkedin: text('linkedin'),
	photoUrl: text('photo_url'),
	available: boolean('available').notNull().default(true),
	// Show the GitHub/LinkedIn link? Separate from the username so a link can be hidden without
	// blanking it (and so an empty github can always be re-filled from the admin's login).
	showGithub: boolean('show_github').notNull().default(true),
	showLinkedin: boolean('show_linkedin').notNull().default(true),
	bioEn: text('bio_en').notNull(),
	bioSv: text('bio_sv').notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const section = pgTable('section', {
	id: serial('id').primaryKey(),
	slug: text('slug').notNull().unique(),
	labelEn: text('label_en').notNull(),
	labelSv: text('label_sv').notNull(),
	displayType: text('display_type').notNull().default('entries'),
	visible: boolean('visible').notNull().default(true),
	showInPdf: boolean('show_in_pdf').notNull().default(true),
	sortOrder: integer('sort_order').notNull()
});

export const sectionItem = pgTable(
	'section_item',
	{
		id: serial('id').primaryKey(),
		sectionId: integer('section_id')
			.notNull()
			.references(() => section.id, { onDelete: 'cascade' }),
		titleEn: text('title_en').notNull(),
		titleSv: text('title_sv').notNull(),
		subtitleEn: text('subtitle_en'),
		subtitleSv: text('subtitle_sv'),
		startDate: date('start_date', { mode: 'string' }),
		endDate: date('end_date', { mode: 'string' }),
		link: text('link'),
		descriptionEn: text('description_en'),
		descriptionSv: text('description_sv'),
		sortOrder: integer('sort_order').notNull()
	},
	(t) => [index('section_item_section_idx').on(t.sectionId, t.sortOrder)]
);

/** Binary data (Postgres bytea). Drizzle 0.45 has no built-in type; this is its documented way. */
const bytea = customType<{ data: Uint8Array }>({
	dataType: () => 'bytea'
});

/**
 * The uploaded profile photo, already processed (a 256×256 JPEG). One row at most. Kept out of
 * `profile` so loading the profile — on every page view — never reads image bytes.
 */
export const profilePhoto = pgTable('profile_photo', {
	id: serial('id').primaryKey(),
	data: bytea('data').notNull(),
	contentType: text('content_type').notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

/**
 * A job application (admin-only). `status` is plain text checked in code ($lib/applications),
 * so adding a status needs no migration. Never bumps `profile.updatedAt`: that date is the
 * public footer's "Updated" and must not reveal job-search activity.
 */
export const application = pgTable('application', {
	id: serial('id').primaryKey(),
	company: text('company').notNull(),
	role: text('role').notNull(),
	status: text('status').notNull().default('not_applied'),
	/**
	 * What the application is written in ('en' | 'sv', checked in code): its letter, the CV
	 * attached to it and any CV snapshot all follow it, never the visitor's language (R7).
	 */
	language: text('language').notNull().default('en'),
	adUrl: text('ad_url'),
	adText: text('ad_text'),
	location: text('location'),
	deadline: date('deadline', { mode: 'string' }),
	appliedOn: date('applied_on', { mode: 'string' }),
	notes: text('notes'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

/** One row per status an application has had, the first on creation: its timeline. */
export const applicationStatusChange = pgTable(
	'application_status_change',
	{
		id: serial('id').primaryKey(),
		applicationId: integer('application_id')
			.notNull()
			.references(() => application.id, { onDelete: 'cascade' }),
		status: text('status').notNull(),
		changedAt: timestamp('changed_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [index('application_status_change_application_idx').on(t.applicationId)]
);

/** People at the company for an application (R6); the letter can address one of them. */
export const applicationContact = pgTable(
	'application_contact',
	{
		id: serial('id').primaryKey(),
		applicationId: integer('application_id')
			.notNull()
			.references(() => application.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		role: text('role'),
		email: text('email'),
		phone: text('phone'),
		note: text('note'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [index('application_contact_application_idx').on(t.applicationId)]
);

/**
 * An application's personal letter: at most one (the unique application_id). The PDF options are
 * stored, so the same letter always renders the same PDF. Its language is the application's.
 */
export const letter = pgTable('letter', {
	id: serial('id').primaryKey(),
	applicationId: integer('application_id')
		.notNull()
		.unique()
		.references(() => application.id, { onDelete: 'cascade' }),
	body: text('body').notNull().default(''),
	includeContact: boolean('include_contact').notNull().default(false),
	includeRecipient: boolean('include_recipient').notNull().default(false),
	/** Append the CV, in the application's language, after the letter in one PDF. */
	attachCv: boolean('attach_cv').notNull().default(false),
	/** Deleting the contact leaves the letter addressed to the company only. */
	recipientContactId: integer('recipient_contact_id').references(() => applicationContact.id, {
		onDelete: 'set null'
	}),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

/**
 * A PDF exactly as it was sent (R8): rendered once when saved and never changed, so later edits
 * to the letter or the CV can't touch it. `kind` and `language` are text, checked in code
 * ($lib/snapshots). The filename is stored too, so renaming the profile or the company doesn't
 * rename an old snapshot. List queries never select `data`.
 */
export const applicationSnapshot = pgTable(
	'application_snapshot',
	{
		id: serial('id').primaryKey(),
		applicationId: integer('application_id')
			.notNull()
			.references(() => application.id, { onDelete: 'cascade' }),
		kind: text('kind').notNull(),
		language: text('language').notNull(),
		filename: text('filename').notNull(),
		data: bytea('data').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [index('application_snapshot_application_idx').on(t.applicationId)]
);

/**
 * Site settings: one row (the CHECK makes that a database rule), one typed column per setting,
 * each with a default. Reads fall back to the defaults while the row doesn't exist; a new
 * setting is a new column. Defaults mirror SETTINGS_DEFAULTS ($lib/settings), tested.
 */
export const settings = pgTable(
	'settings',
	{
		id: integer('id').primaryKey().default(1),
		/** Days before a deadline that an unapplied application needs attention. */
		attentionDays: integer('attention_days').notNull().default(7)
	},
	(t) => [check('settings_single_row', sql`${t.id} = 1`)]
);
