// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { htmlToMarkdown } from '../htmlToMarkdown';
import { parseMarkdown } from '../markdownParse';

describe('htmlToMarkdown', () => {
	it('converts a Google Docs paste', () => {
		const html = readFileSync('src/lib/__tests__/fixtures/gdocs.html', 'utf8');
		expect(htmlToMarkdown(html)).toBe(
			[
				'## Why Spotify',
				'Hej Anna,',
				'I lead **50 engineers** and *love it*. See [my GitHub](https://github.com/msvens).',
				'- People\n  - Hiring\n- Data',
				'1. First\n2. Second',
				'Med vänliga hälsningar,',
				'Martin'
			].join('\n\n')
		);
	});

	it('converts a real Google Docs copy (a template letter)', () => {
		const html = readFileSync('src/lib/__tests__/fixtures/gdocs-letter.html', 'utf8');
		const md = htmlToMarkdown(html)!;
		expect(md.split('\n\n').map((block) => block.slice(0, 30))).toEqual([
			'**Dear Ms. Reader,**',
			'Lorem ipsum dolor sit amet, co',
			'- Hej\n- Hopp\n- Konnu',
			'## Bla',
			'Duis autem vel eum iriure dolo',
			'Nam liber tempor cum soluta no',
			'Sincerely,'
		]);
	});

	it('converts plain formatting tags, as web pages and Pages copy them', () => {
		const html =
			'<h1>Title</h1><p>Some <strong>bold</strong>, <em>italic</em> and <b><i>both</i></b>.<br>Next line</p>' +
			'<ol><li>One<ul><li>nested</li></ul></li><li>Two</li></ol><h4>Deep</h4>';
		expect(htmlToMarkdown(html)).toBe(
			[
				'# Title',
				'Some **bold**, *italic* and ***both***.  \nNext line',
				'1. One\n   - nested\n2. Two',
				'### Deep'
			].join('\n\n')
		);
	});

	it('marks nested bold or italics once', () => {
		expect(htmlToMarkdown('<p><strong>a <b>b</b></strong> <em><i>c</i></em></p>')).toBe(
			'**a b** *c*'
		);
	});

	it('keeps only the words of an unsafe link', () => {
		expect(htmlToMarkdown('<p><a href="javascript:alert(1)">click</a> me</p>')).toBe('click me');
	});

	it('escapes text that would otherwise turn into markdown', () => {
		expect(htmlToMarkdown('<p>2 * 3 = 6 and snake_case [x]</p>')).toBe(
			'2 \\* 3 = 6 and snake\\_case \\[x\\]'
		);
		expect(htmlToMarkdown('<p># not a heading</p><p>1. not a list</p><p>- nor this</p>')).toBe(
			'\\# not a heading\n\n1\\. not a list\n\n\\- nor this'
		);
	});

	it('collapses whitespace and keeps spaces outside bold', () => {
		expect(htmlToMarkdown('<p>a&nbsp;&nbsp;<b> bold </b>  word</p>')).toBe('a **bold** word');
	});

	it('drops scripts, styles and images', () => {
		expect(
			htmlToMarkdown('<style>p{}</style><p>Hi<script>x()</script><img src="a.png" alt="pic"></p>')
		).toBe('Hi');
	});

	it('makes one paragraph per table row', () => {
		expect(htmlToMarkdown('<table><tr><td>a</td><td>b</td></tr><tr><td>c</td></tr></table>')).toBe(
			'a b\n\nc'
		);
	});

	it('leaves code-editor HTML and empty input as plain text (null)', () => {
		const vscode =
			'<div style="color: #d4d4d4;font-family: Menlo;white-space: pre;"><div><span>**bold** source</span></div></div>';
		expect(htmlToMarkdown(vscode)).toBeNull();
		expect(htmlToMarkdown('<pre>x</pre>')).toBeNull();
		expect(htmlToMarkdown('<p> </p>')).toBeNull();
	});

	it('reads back as intended: nested lists nest, escaped characters are literal', () => {
		const md = htmlToMarkdown('<ul><li>a</li><ul><li>b</li></ul></ul><p>2 * 3 and # x</p>')!;
		expect(parseMarkdown(md)).toEqual([
			{
				kind: 'list',
				ordered: false,
				items: [
					[
						{ kind: 'plain', children: [{ kind: 'text', text: 'a' }] },
						{
							kind: 'list',
							ordered: false,
							items: [[{ kind: 'plain', children: [{ kind: 'text', text: 'b' }] }]]
						}
					]
				]
			},
			{ kind: 'paragraph', children: expect.any(Array) }
		]);
		const para = parseMarkdown(md)[1] as { children: { text?: string }[] };
		expect(para.children.map((c) => c.text).join('')).toBe('2 * 3 and # x');
	});
});
