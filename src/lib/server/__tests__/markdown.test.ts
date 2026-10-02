import { describe, expect, it } from 'vitest';
import { profileSeed } from '$lib/server/db/seed-data';
import { parseMarkdown } from '../markdown';

const text = (t: string) => ({ kind: 'text', text: t });

describe('parseMarkdown', () => {
	it('splits paragraphs on blank lines', () => {
		expect(parseMarkdown('First.\n\nSecond.')).toEqual([
			{ kind: 'paragraph', children: [text('First.')] },
			{ kind: 'paragraph', children: [text('Second.')] }
		]);
	});

	it('parses the seed bio into its two paragraphs', () => {
		expect(parseMarkdown(profileSeed.bioEn).map((b) => b.kind)).toEqual(['paragraph', 'paragraph']);
	});

	it('keeps bold and italics, including inside list items', () => {
		expect(parseMarkdown('- **bold** and *em*')).toEqual([
			{
				kind: 'list',
				ordered: false,
				items: [
					[
						{
							kind: 'plain',
							children: [
								{ kind: 'strong', children: [text('bold')] },
								text(' and '),
								{ kind: 'em', children: [text('em')] }
							]
						}
					]
				]
			}
		]);
	});

	it('renders tight list items inline and loose ones as paragraphs', () => {
		const [tight] = parseMarkdown('1. a\n2. b');
		const [loose] = parseMarkdown('- a\n\n- b');
		expect(tight).toMatchObject({
			kind: 'list',
			ordered: true,
			items: [[{ kind: 'plain' }], [{ kind: 'plain' }]]
		});
		expect(loose).toMatchObject({
			kind: 'list',
			ordered: false,
			items: [[{ kind: 'paragraph' }], [{ kind: 'paragraph' }]]
		});
	});

	it('keeps inline code and hard line breaks', () => {
		expect(parseMarkdown('`a<b` x  \ny')).toEqual([
			{
				kind: 'paragraph',
				children: [{ kind: 'code', text: 'a<b' }, text(' x'), { kind: 'br' }, text('y')]
			}
		]);
	});

	it('keeps safe links', () => {
		expect(parseMarkdown('[site](https://example.com) [me](mailto:a@b.c)')[0]).toEqual({
			kind: 'paragraph',
			children: [
				{ kind: 'link', href: 'https://example.com', children: [text('site')] },
				text(' '),
				{ kind: 'link', href: 'mailto:a@b.c', children: [text('me')] }
			]
		});
	});

	it.each([
		'javascript:alert(1)',
		'JavaScript:alert(1)',
		'data:text/html,x',
		'/relative',
		'x.html'
	])('drops the link but keeps its words for %s', (href) => {
		expect(parseMarkdown(`[click](${href})`)).toEqual([
			{ kind: 'paragraph', children: [text('click')] }
		]);
	});

	describe('raw HTML is shown as text, never as markup', () => {
		it.each([
			'<script>alert(1)</script>',
			'<img src=x onerror="alert(1)">',
			'<iframe src="https://evil.example"></iframe>'
		])('block %s', (html) => {
			expect(parseMarkdown(html)).toEqual([{ kind: 'paragraph', children: [text(html)] }]);
		});

		it('inline <b>', () => {
			expect(parseMarkdown('a <b>b</b> c')).toEqual([
				{
					kind: 'paragraph',
					children: [text('a '), text('<b>'), text('b'), text('</b>'), text(' c')]
				}
			]);
		});
	});

	it('reduces an image to its alt text', () => {
		expect(parseMarkdown('![a photo](https://x.y/p.png)')).toEqual([
			{ kind: 'paragraph', children: [text('a photo')] }
		]);
	});

	it('renders a heading as a plain paragraph', () => {
		expect(parseMarkdown('# Title')).toEqual([{ kind: 'paragraph', children: [text('Title')] }]);
	});

	it('leaves a bare URL as text (CommonMark, as the old app)', () => {
		expect(parseMarkdown('see http://www.restlet.org')).toEqual([
			{ kind: 'paragraph', children: [text('see http://www.restlet.org')] }
		]);
	});
});
