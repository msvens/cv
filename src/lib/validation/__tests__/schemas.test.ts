import { describe, expect, it } from 'vitest';
import { sectionItemSchema, sectionSchema } from '../schemas';

const section = {
	slug: 'work-history',
	labelEn: 'Work',
	labelSv: 'Arbete',
	displayType: 'entries',
	visible: true,
	showInPdf: true
};
const item = {
	titleEn: 'A',
	titleSv: 'A',
	subtitleEn: '',
	subtitleSv: '',
	startDate: '',
	endDate: '',
	link: '',
	descriptionEn: '',
	descriptionSv: ''
};
const issues = (r: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
	r.success ? [] : r.error!.issues.map((i) => i.path.join('.'));

describe('sectionSchema', () => {
	it('accepts a valid section', () => {
		expect(sectionSchema.safeParse(section).success).toBe(true);
	});

	it.each(['Work History', 'work_history', 'Work', ''])('rejects the slug %j', (slug) => {
		expect(issues(sectionSchema.safeParse({ ...section, slug }))).toEqual(['slug']);
	});

	it('only knows entries and chips', () => {
		expect(issues(sectionSchema.safeParse({ ...section, displayType: 'grid' }))).toEqual([
			'displayType'
		]);
	});
});

describe('sectionItemSchema', () => {
	it('accepts an item with only titles (as chips submit it)', () => {
		expect(sectionItemSchema.safeParse(item).success).toBe(true);
	});

	it('accepts dates in order and an open end', () => {
		const ok = (startDate: string, endDate: string) =>
			sectionItemSchema.safeParse({ ...item, startDate, endDate }).success;
		expect(ok('2018-01-01', '2020-06-30')).toBe(true);
		expect(ok('2018-01-01', '')).toBe(true);
	});

	it('rejects an end date before the start date, on the end date', () => {
		expect(
			issues(
				sectionItemSchema.safeParse({ ...item, startDate: '2020-01-01', endDate: '2018-01-01' })
			)
		).toEqual(['endDate']);
	});

	it.each(['javascript:alert(1)', 'data:text/html,x', 'example.com'])(
		'rejects the link %j (#16)',
		(link) => {
			expect(issues(sectionItemSchema.safeParse({ ...item, link }))).toEqual(['link']);
		}
	);

	it('accepts http(s) and mailto links', () => {
		for (const link of ['https://github.com/msvens/cv', 'mailto:a@b.c']) {
			expect(sectionItemSchema.safeParse({ ...item, link }).success).toBe(true);
		}
	});
});
