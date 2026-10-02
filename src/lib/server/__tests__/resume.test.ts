import { describe, expect, it } from 'vitest';
import type { ProfileData, SectionItemData, SectionWithItems } from '$lib/types';
import { buildResumeView } from '../resume';

const profile: ProfileData = {
	id: 1,
	name: 'Ada Lovelace',
	titleEn: 'Engineer',
	titleSv: 'Ingenjör',
	email: 'ada@example.com',
	phone: null,
	locationEn: 'London, UK',
	locationSv: 'London, Storbritannien',
	github: null,
	linkedin: null,
	photoUrl: '/profile.jpg',
	available: true,
	bioEn: 'First.\n\nSecond.',
	bioSv: 'Första.',
	updatedAt: new Date('2026-04-22T07:51:59Z')
};

function item(overrides: Partial<SectionItemData>): SectionItemData {
	return {
		id: 1,
		sectionId: 1,
		titleEn: 'Title',
		titleSv: 'Titel',
		subtitleEn: null,
		subtitleSv: null,
		startDate: null,
		endDate: null,
		link: null,
		descriptionEn: null,
		descriptionSv: null,
		sortOrder: 10,
		...overrides
	};
}

function section(
	overrides: Partial<SectionWithItems> & { items: SectionItemData[] }
): SectionWithItems {
	return {
		id: 1,
		slug: 'experience',
		labelEn: 'Experience',
		labelSv: 'Erfarenhet',
		displayType: 'entries',
		visible: true,
		showInPdf: true,
		sortOrder: 10,
		...overrides
	};
}

describe('buildResumeView', () => {
	it('picks the English fields for en', () => {
		const { header } = buildResumeView(profile, [], 'en');
		expect(header).toMatchObject({
			name: 'Ada Lovelace',
			title: 'Engineer',
			location: 'London, UK',
			email: 'ada@example.com',
			photoUrl: '/profile.jpg',
			available: true,
			phone: null
		});
		expect(header.bio.map((b) => b.kind)).toEqual(['paragraph', 'paragraph']);
	});

	it('picks the Swedish fields for sv', () => {
		const view = buildResumeView(
			profile,
			[section({ items: [item({ subtitleEn: 'Lead', subtitleSv: 'Ledare' })] })],
			'sv'
		);
		expect(view.header.title).toBe('Ingenjör');
		expect(view.header.location).toBe('London, Storbritannien');
		expect(view.header.bio).toHaveLength(1);
		expect(view.sections[0]).toMatchObject({
			label: 'Erfarenhet',
			kind: 'entries',
			entries: [{ title: 'Titel', subtitle: 'Ledare' }]
		});
	});

	it('renders chip sections as a list of titles', () => {
		const view = buildResumeView(
			profile,
			[
				section({
					displayType: 'chips',
					items: [item({ id: 1, titleEn: 'Go' }), item({ id: 2, titleEn: 'Rust' })]
				})
			],
			'en'
		);
		expect(view.sections[0]).toEqual({
			id: 1,
			label: 'Experience',
			kind: 'chips',
			chips: ['Go', 'Rust']
		});
	});

	it('treats an unknown display type as entries, as the old app did', () => {
		const view = buildResumeView(profile, [section({ displayType: 'grid', items: [] })], 'en');
		expect(view.sections[0].kind).toBe('entries');
	});

	it('formats date ranges in the page language', () => {
		const ongoing = [section({ items: [item({ startDate: '2018-01-01' })] })];
		expect(buildResumeView(profile, ongoing, 'en').sections[0]).toMatchObject({
			entries: [{ dateRange: '2018 — Present' }]
		});
		expect(buildResumeView(profile, ongoing, 'sv').sections[0]).toMatchObject({
			entries: [{ dateRange: '2018 — Nuvarande' }]
		});
	});

	it('maps blank optional fields to null', () => {
		const view = buildResumeView(
			{ ...profile, phone: '  ', photoUrl: '' },
			[section({ items: [item({ subtitleEn: '', descriptionEn: '   ' })] })],
			'en'
		);
		expect(view.header.phone).toBeNull();
		expect(view.header.photoUrl).toBeNull();
		expect(view.sections[0]).toMatchObject({
			entries: [{ subtitle: null, description: null, dateRange: null, link: null }]
		});
	});

	it('parses descriptions as markdown', () => {
		const view = buildResumeView(
			profile,
			[section({ items: [item({ descriptionEn: '- **one**\n- two' })] })],
			'en'
		);
		expect(view.sections[0]).toMatchObject({
			entries: [{ description: [{ kind: 'list', ordered: false }] }]
		});
	});

	it('keeps safe item links and drops unsafe ones', () => {
		const view = buildResumeView(
			profile,
			[
				section({
					items: [
						item({ id: 1, link: 'https://github.com/msvens/cv' }),
						item({ id: 2, link: 'javascript:alert(1)' })
					]
				})
			],
			'en'
		);
		expect(view.sections[0]).toMatchObject({
			entries: [{ link: 'https://github.com/msvens/cv' }, { link: null }]
		});
	});
});
