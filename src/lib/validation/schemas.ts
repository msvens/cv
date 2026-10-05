import { z } from 'zod/v4';

// Form values arrive trimmed (see $lib/server/forms.ts); an empty optional field is ''.
const required = z.string().min(1, 'Required');
const blank = z.literal('');

// Both stored as usernames, never URLs: $lib/social.ts builds the links (#11).
const githubUsername = z
	.string()
	.regex(
		/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/,
		'A GitHub username only (letters, digits, hyphens), not a URL'
	);
const linkedinUsername = z
	.string()
	.regex(/^[A-Za-z0-9-]{3,100}$/, 'A LinkedIn username only: the part after linkedin.com/in/');
const photoUrl = z
	.string()
	.regex(/^(\/|https?:\/\/)/i, 'A path such as /profile.jpg, or an http(s) URL');

export const profileSchema = z.object({
	name: required,
	titleEn: required,
	titleSv: required,
	email: z.email('Not a valid email address'),
	phone: z.string(),
	locationEn: required,
	locationSv: required,
	github: githubUsername.or(blank),
	linkedin: linkedinUsername.or(blank),
	photoUrl: photoUrl.or(blank),
	available: z.boolean(),
	showGithub: z.boolean(),
	showLinkedin: z.boolean(),
	bioEn: required,
	bioSv: required
});

export const sectionSchema = z.object({
	slug: z
		.string()
		.regex(/^[a-z0-9-]+$/, 'Lowercase letters, digits and hyphens only, e.g. "work-history"'),
	labelEn: required,
	labelSv: required,
	displayType: z.enum(['entries', 'chips']),
	visible: z.boolean(),
	showInPdf: z.boolean()
	// No sortOrder: the order is managed on the server (new rows last, moved with up/down).
});

// What <input type="date"> sends; blank means "no date".
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'A date as YYYY-MM-DD');

export const sectionItemSchema = z
	.object({
		titleEn: required,
		titleSv: required,
		subtitleEn: z.string(),
		subtitleSv: z.string(),
		startDate: isoDate.or(blank),
		endDate: isoDate.or(blank),
		// Same rule as safeHref: only links that are safe to render (#16).
		link: z
			.string()
			.regex(/^(https?:|mailto:)/i, 'An http(s) or mailto: link')
			.or(blank),
		descriptionEn: z.string(),
		descriptionSv: z.string()
	})
	// ISO dates compare correctly as strings.
	.refine((item) => !item.startDate || !item.endDate || item.endDate >= item.startDate, {
		message: 'The end date is before the start date',
		path: ['endDate']
	});

export type ProfileInput = z.infer<typeof profileSchema>;
export type SectionInput = z.infer<typeof sectionSchema>;
export type SectionItemInput = z.infer<typeof sectionItemSchema>;
