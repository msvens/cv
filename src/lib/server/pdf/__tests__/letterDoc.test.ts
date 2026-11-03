import type { Content } from 'pdfmake/interfaces';
import { describe, expect, it } from 'vitest';
import type { LetterParts } from '$lib/server/letter';
import type { ResumeView } from '$lib/resume';
import { buildLetterDoc, buildLetterWithCvDoc } from '../letterDoc';
import { keepHeadingWithContent } from '../resumeDoc';
import { nodes, text } from './content';

const parts: LetterParts = {
	lang: 'en',
	sender: {
		name: 'Martin Svensson',
		title: 'Engineering Director',
		email: 'msvens@gmail.com',
		phone: null,
		location: 'Stockholm, Sweden'
	},
	recipient: { company: 'Spotify', name: 'Anna Berg', role: 'Recruiter' },
	body: [
		{ kind: 'paragraph', children: [{ kind: 'strong', children: [{ kind: 'text', text: 'Hi' }] }] },
		{
			kind: 'list',
			ordered: false,
			items: [[{ kind: 'plain', children: [{ kind: 'text', text: 'One' }] }]]
		}
	]
};
const content = (p: LetterParts = parts) => buildLetterDoc(p).content as Content[];

describe('buildLetterDoc', () => {
	it('is A4 in the CV style', () => {
		expect(buildLetterDoc(parts)).toMatchObject({
			pageSize: 'A4',
			defaultStyle: { font: 'Helvetica' }
		});
	});

	it('puts the sender first, then the recipient, then the body', () => {
		const [sender, recipient, body] = content();
		// A letter's sender block, not the CV's header: one line each, no missing phone.
		expect(sender).toMatchObject({
			stack: [
				{ text: 'Martin Svensson', bold: true },
				'Engineering Director',
				'Stockholm, Sweden',
				'msvens@gmail.com'
			]
		});
		expect(sender).not.toHaveProperty('alignment');
		expect(text(recipient)).toBe('SpotifyAnna BergRecruiter');
		expect(nodes(body)).toContainEqual(expect.objectContaining({ bold: true }));
		expect(nodes(body)).toContainEqual(expect.objectContaining({ ul: expect.anything() }));
	});

	it('is only the body without a sender or recipient', () => {
		const [body, ...rest] = content({ ...parts, sender: null, recipient: null });
		expect(text(body)).toContain('One');
		expect(rest).toEqual([]);
	});
});

describe('buildLetterWithCvDoc', () => {
	const view = (title: string): ResumeView => ({
		header: {
			name: 'Martin Svensson',
			title,
			email: 'msvens@gmail.com',
			phone: null,
			location: 'Stockholm',
			photoUrl: null,
			available: true,
			bio: [{ kind: 'paragraph', children: [{ kind: 'text', text: 'Bio.' }] }]
		},
		sections: []
	});
	const combined = (lang: 'en' | 'sv', title: string) =>
		buildLetterWithCvDoc({ ...parts, lang }, view(title), []);

	it('is the letter, then the CV from a new page, as one A4 document', () => {
		const doc = combined('en', 'Engineering Director');
		const content = doc.content as Content[];
		expect(content).toHaveLength(4);
		expect(content.slice(0, 3)).toEqual(buildLetterDoc(parts).content);
		expect(content.at(-1)).toMatchObject({ pageBreak: 'before' });
		expect(text(content.at(-1))).toContain('MARTIN SVENSSON');
		expect(doc).toMatchObject({ pageSize: 'A4', pageBreakBefore: keepHeadingWithContent });
	});

	it("builds the CV in the letter's language", () => {
		expect(text(combined('sv', 'Teknikchef').content)).toContain('PROFIL');
		expect(text(combined('sv', 'Teknikchef').content)).not.toContain('PROFILE');
		expect(text(combined('en', 'Engineering Director').content)).toContain('PROFILE');
	});
});
