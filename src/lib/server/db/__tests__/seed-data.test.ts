import { describe, it, expect } from 'vitest';
import { profileSeed, sectionsSeed } from '../seed-data';

describe('seed data', () => {
	it('has a complete profile', () => {
		expect(profileSeed.name).toBe('Martin Svensson');
		expect(profileSeed.email).toBeTruthy();
		expect(profileSeed.bioEn).toBeTruthy();
		expect(profileSeed.bioSv).toBeTruthy();
		expect(profileSeed.titleEn).toBeTruthy();
		expect(profileSeed.titleSv).toBeTruthy();
	});

	it('has sections with unique slugs', () => {
		const slugs = sectionsSeed.map((s) => s.section.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
	});

	it('has 8 experience entries', () => {
		const exp = sectionsSeed.find((s) => s.section.slug === 'experience');
		expect(exp).toBeDefined();
		expect(exp!.items).toHaveLength(8);
	});

	it('has chip-type sections for skills', () => {
		const chipSections = sectionsSeed.filter((s) => s.section.displayType === 'chips');
		expect(chipSections.length).toBeGreaterThanOrEqual(3);
		for (const cs of chipSections) {
			expect(cs.items.length).toBeGreaterThan(0);
		}
	});

	it('has 5 education entries', () => {
		const edu = sectionsSeed.find((s) => s.section.slug === 'education');
		expect(edu).toBeDefined();
		expect(edu!.items).toHaveLength(5);
	});

	it('has 6 project entries with links', () => {
		const proj = sectionsSeed.find((s) => s.section.slug === 'projects');
		expect(proj).toBeDefined();
		expect(proj!.items).toHaveLength(6);
		for (const p of proj!.items) {
			expect(p.link).toBeTruthy();
		}
	});

	it('has 11 patent entries', () => {
		const pat = sectionsSeed.find((s) => s.section.slug === 'patents');
		expect(pat).toBeDefined();
		expect(pat!.items).toHaveLength(11);
	});

	it('all items have both EN and SV titles', () => {
		for (const { items } of sectionsSeed) {
			for (const item of items) {
				expect(item.titleEn).toBeTruthy();
				expect(item.titleSv).toBeTruthy();
			}
		}
	});
});
