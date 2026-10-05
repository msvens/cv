import type { Content, Node, NodeQueries } from 'pdfmake/interfaces';
import { describe, expect, it } from 'vitest';
import type { ResumeView } from '$lib/resume';
import type { SocialLink } from '$lib/social';
import { buildResumeDoc, fileSlug, keepHeadingWithContent } from '../resumeDoc';

const view: ResumeView = {
	header: {
		name: 'Martin Svensson',
		title: 'Engineering Director',
		email: 'msvens@gmail.com',
		phone: null,
		location: 'Stockholm, Sweden',
		photoUrl: '/profile.jpg',
		available: true,
		bio: [
			{ kind: 'paragraph', children: [{ kind: 'text', text: 'First.' }] },
			{ kind: 'paragraph', children: [{ kind: 'text', text: 'Second.' }] }
		]
	},
	sections: [
		{
			id: 1,
			label: 'Experience',
			kind: 'entries',
			entries: [
				{
					id: 1,
					title: 'Spotify',
					subtitle: 'Engineering Director',
					dateRange: '2018 — Present',
					link: null,
					description: [
						{
							kind: 'list',
							ordered: false,
							items: [
								[
									{
										kind: 'plain',
										children: [{ kind: 'strong', children: [{ kind: 'text', text: 'Led' }] }]
									}
								]
							]
						}
					]
				},
				{
					id: 2,
					title: 'cv',
					subtitle: null,
					dateRange: null,
					link: 'https://github.com/msvens/cv',
					description: null
				}
			]
		},
		{ id: 2, label: 'Skills', kind: 'chips', chips: ['Go', 'Rust'] }
	]
};

const github: SocialLink = { label: 'GitHub', href: 'https://github.com/msvens' };

/** Every node in a pdfmake content tree, depth first. */
function nodes(content: unknown): Record<string, unknown>[] {
	if (Array.isArray(content)) return content.flatMap(nodes);
	if (content === null || typeof content !== 'object') return [];
	const node = content as Record<string, unknown>;
	return [node, ...Object.values(node).flatMap(nodes)];
}

/** All text in a content tree, concatenated. */
function text(content: unknown): string {
	if (typeof content === 'string') return content;
	if (Array.isArray(content)) return content.map(text).join('');
	if (content && typeof content === 'object') {
		const node = content as Record<string, unknown>;
		return ['text', 'stack', 'columns', 'ul', 'ol'].map((k) => text(node[k])).join('');
	}
	return '';
}

const content = (lang: 'en' | 'sv' = 'en', links = [github], v = view) =>
	buildResumeDoc(v, links, lang).content as Content[];

describe('buildResumeDoc', () => {
	it('prints the name uppercased and letter-spaced', () => {
		const name = nodes(content()).find((n) => n.text === 'MARTIN SVENSSON');
		expect(name).toMatchObject({ bold: true, characterSpacing: 3 });
	});

	it('lists the contact details, with profile links clickable', () => {
		const header = text(content()[0]);
		expect(header).toContain('msvens@gmail.com');
		expect(header).toContain('Stockholm, Sweden');
		expect(nodes(content()[0])).toContainEqual({
			text: 'GitHub',
			link: 'https://github.com/msvens'
		});
	});

	it('only shows the phone and links the profile has', () => {
		const without = text(content('en', [])[0]);
		expect(without).not.toContain('GitHub');
		const withPhone = text(
			content('en', [], { ...view, header: { ...view.header, phone: '+46 70' } })[0]
		);
		expect(withPhone).toContain('+46 70');
	});

	it('translates the profile heading', () => {
		expect(text(content('en')[1])).toContain('PROFILE');
		expect(text(content('sv')[1])).toContain('PROFIL');
	});

	it('keeps bio paragraphs as separate blocks', () => {
		// One huge text block broke page flow in the old app (fix 5afbfc6).
		const bio = nodes(content()[1]).filter(
			(n) => Array.isArray(n.text) && ['First.', 'Second.'].includes(text(n))
		);
		expect(bio).toHaveLength(2);
	});

	it('puts title and subtitle left and the date right', () => {
		const row = nodes(content()[2]).find((n) => Array.isArray(n.columns)) as {
			columns: Record<string, unknown>[];
		};
		expect(text(row.columns[0])).toBe('Spotify — Engineering Director');
		expect(row.columns[0]).toMatchObject({ bold: true }); // the whole line, as in the old PDF
		expect(row.columns[1]).toMatchObject({ text: '2018 — Present', alignment: 'right' });
	});

	it('links an entry title only when it has a link, and omits a missing date', () => {
		const rows = nodes(content()[2]).filter((n) => Array.isArray(n.columns)) as {
			columns: Record<string, unknown>[];
		}[];
		expect(nodes(rows[0])).not.toContainEqual(expect.objectContaining({ link: expect.anything() }));
		expect(nodes(rows[1])).toContainEqual(
			expect.objectContaining({ text: 'cv', link: 'https://github.com/msvens/cv' })
		);
		expect(rows[1].columns).toHaveLength(1);
	});

	it('renders markdown lists as bullet lists with bold runs', () => {
		const list = nodes(content()[2]).find((n) => Array.isArray(n.ul));
		expect(list).toBeDefined();
		expect(nodes(list)).toContainEqual(expect.objectContaining({ bold: true, text: ['Led'] }));
	});

	it('renders markdown headings as bold lines', () => {
		const withHeading: ResumeView = {
			...view,
			header: {
				...view.header,
				bio: [{ kind: 'heading', level: 1, children: [{ kind: 'text', text: 'Focus' }] }]
			}
		};
		const heading = nodes(content('en', [github], withHeading)[1]).find(
			(n) => Array.isArray(n.text) && text(n) === 'Focus'
		);
		expect(heading).toMatchObject({ bold: true });
	});

	it('renders chips as shaded runs', () => {
		const chips = nodes(content()[3]).filter((n) => n.background === '#f3f3f3');
		expect(chips.map((c) => String(c.text).trim())).toEqual(['Go', 'Rust']);
	});

	it('keeps a multi-word chip on one line', () => {
		const multi = {
			...view,
			sections: [
				{
					id: 3,
					label: 'Skills',
					kind: 'chips' as const,
					chips: ['Mobile Application Development']
				}
			]
		};
		const [chip] = nodes(content('en', [github], multi)[2]).filter(
			(n) => n.background === '#f3f3f3'
		);
		expect(String(chip.text)).not.toContain(' ');
	});
});

describe('fileSlug', () => {
	it.each([
		['Martin Svensson', 'martin-svensson'],
		['Åsa Öberg-Ängström', 'asa-oberg-angstrom'],
		['  Zoë   Ünal ', 'zoe-unal']
	])('%s → %s', (name, slug) => {
		expect(fileSlug(name)).toBe(slug);
	});
});

describe('page breaks', () => {
	it('marks every section title as a heading and uses the heading rule', () => {
		const doc = buildResumeDoc(view, [github], 'en');
		expect(doc.pageBreakBefore).toBe(keepHeadingWithContent);
		const headings = nodes(doc.content).filter((n) => n.headlineLevel === 1);
		expect(headings.map((h) => h.text)).toEqual(['PROFILE', 'EXPERIENCE', 'SKILLS']);
	});

	it('keeps each entry on one page', () => {
		const entries = nodes(content()[2]).filter((n) => n.unbreakable === true);
		expect(entries).toHaveLength(2);
	});
});

describe('keepHeadingWithContent', () => {
	/** A laid-out node as pdfmake reports it to the hook. */
	const laidOut = (fields: Partial<Node>): Node => ({
		pageNumbers: [1],
		pages: 2,
		stack: false,
		startPosition: {
			pageNumber: 1,
			pageOrientation: 'portrait',
			pageInnerHeight: 760,
			pageInnerWidth: 495,
			left: 50,
			top: 700,
			verticalRatio: 0.9,
			horizontalRatio: 0
		},
		...fields
	});
	const following = (...after: Node[]): NodeQueries => ({
		getFollowingNodesOnPage: () => after,
		getNodesOnNextPage: () => [],
		getPreviousNodesOnPage: () => []
	});
	const heading = laidOut({ text: 'SKILLS', headlineLevel: 1 });
	const rule = laidOut({ canvas: [] });
	const container = laidOut({ stack: true });

	it('moves a heading that ends the page', () => {
		expect(keepHeadingWithContent(heading, following())).toBe(true);
	});

	it('moves a heading followed only by its rule and empty containers', () => {
		expect(keepHeadingWithContent(heading, following(rule, container))).toBe(true);
	});

	it('keeps a heading when its content starts on the same page', () => {
		expect(keepHeadingWithContent(heading, following(rule, laidOut({ text: 'Go' })))).toBe(false);
	});

	it('never moves anything that is not a heading', () => {
		expect(keepHeadingWithContent(laidOut({ text: 'body' }), following())).toBe(false);
	});
});
