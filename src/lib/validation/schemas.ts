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
		.min(1)
		.regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
	labelEn: z.string().min(1),
	labelSv: z.string().min(1),
	displayType: z.enum(['entries', 'chips']),
	visible: z.boolean(),
	showInPdf: z.boolean(),
	sortOrder: z.number().int()
});

export const sectionItemSchema = z.object({
	sectionId: z.number().int(),
	titleEn: z.string().min(1),
	titleSv: z.string().min(1),
	subtitleEn: z.string().optional().or(z.literal('')),
	subtitleSv: z.string().optional().or(z.literal('')),
	startDate: z.string().optional().or(z.literal('')),
	endDate: z.string().optional().or(z.literal('')),
	link: z.string().optional().or(z.literal('')),
	descriptionEn: z.string().optional().or(z.literal('')),
	descriptionSv: z.string().optional().or(z.literal('')),
	sortOrder: z.number().int()
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type SectionInput = z.infer<typeof sectionSchema>;
export type SectionItemInput = z.infer<typeof sectionItemSchema>;
