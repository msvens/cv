import { z } from 'zod/v4';

export const profileSchema = z.object({
	name: z.string().min(1),
	titleEn: z.string().min(1),
	titleSv: z.string().min(1),
	email: z.email(),
	phone: z.string().optional().or(z.literal('')),
	locationEn: z.string().min(1),
	locationSv: z.string().min(1),
	github: z.string().optional().or(z.literal('')),
	linkedin: z.string().optional().or(z.literal('')),
	photoUrl: z.string().optional().or(z.literal('')),
	available: z.boolean(),
	bioEn: z.string().min(1),
	bioSv: z.string().min(1)
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
