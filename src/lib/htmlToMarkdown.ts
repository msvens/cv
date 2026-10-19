import { safeHref } from '$lib/markdown';

/**
 * Formatted text from the clipboard (Google Docs, Pages, Notion, mail, web pages) as markdown,
 * for the admin editor's paste. Only what our markdown keeps survives: paragraphs, headings,
 * lists, bold, italics, line breaks and safe links; everything else becomes plain text. Literal
 * markdown characters are escaped, so pasted text never turns into formatting by accident.
 *
 * Returns null when the paste should stay plain text: nothing to convert, or HTML from a code
 * editor (VS Code, JetBrains), which is how markdown *source* is copied and must not be escaped.
 * Runs in the browser only (DOMParser).
 */
export function htmlToMarkdown(html: string): string | null {
	const body = new DOMParser().parseFromString(html, 'text/html').body;
	const fromDocs = body.querySelector('[id^="docs-internal-guid"]') !== null;
	if (!fromDocs && [body, ...body.querySelectorAll('*')].some(isCode)) return null;
	return blocks(body).join('\n\n') || null;
}

const BLOCKS = new Set(
	(
		'p div section article header footer main aside blockquote figure table thead tbody tfoot tr ' +
		'h1 h2 h3 h4 h5 h6 ul ol li hr'
	).split(' ')
);
const BLOCK_SELECTOR = [...BLOCKS].join(',');
const SKIPPED = new Set(['script', 'style', 'meta', 'title', 'head', 'template', 'img', 'svg']);

/**
 * Code editors (VS Code, JetBrains) copy with `white-space: pre` in a monospace font. Both are
 * needed: Google Docs puts `white-space: pre` on list items too. Only the last declaration of a
 * property counts, as in CSS (Docs writes `white-space:pre;white-space:pre-wrap` on spans).
 */
function isCode(el: Element): boolean {
	if (el.tagName === 'PRE') return true;
	const style = el.getAttribute('style') ?? '';
	const last = (property: string) =>
		[...style.matchAll(new RegExp(`${property}:\\s*([^;]+)`, 'gi'))].at(-1)?.[1].trim() ?? '';
	return (
		last('white-space').toLowerCase() === 'pre' &&
		/monospace|menlo|monaco|consolas|courier|mono\b/i.test(last('font-family'))
	);
}

const tag = (node: Node) => (node instanceof Element ? node.tagName.toLowerCase() : '');

/** The children of `el` as markdown blocks; runs of inline content become paragraphs. */
function blocks(el: Element): string[] {
	const out: string[] = [];
	let run: Node[] = [];
	const flush = () => {
		const text = paragraph(run);
		if (text) out.push(text);
		run = [];
	};
	for (const node of el.childNodes) {
		const name = tag(node);
		if (SKIPPED.has(name)) continue;
		if (!BLOCKS.has(name)) {
			// An inline element holding blocks is a wrapper, like Google Docs' <b> around a paste.
			if (node instanceof Element && node.querySelector(BLOCK_SELECTOR)) {
				flush();
				out.push(...blocks(node));
			} else {
				run.push(node);
			}
			continue;
		}
		flush();
		if (/^h[1-6]$/.test(name)) {
			const text = lines(inline(node, {}));
			if (text) out.push(`${'#'.repeat(Math.min(Number(name[1]), 3))} ${text}`);
		} else if (name === 'ul' || name === 'ol') {
			const list = listLines(node as Element, '').join('\n');
			if (list) out.push(list);
		} else if (name === 'tr') {
			const text = paragraph([...node.childNodes]);
			if (text) out.push(text);
		} else if (name !== 'hr') {
			out.push(...blocks(node as Element));
		}
	}
	flush();
	return out;
}

/** A list's lines, nested lists indented under their item's text. */
function listLines(list: Element, indent: string): string[] {
	const ordered = tag(list) === 'ol';
	const out: string[] = [];
	let n = 0;
	let childIndent = indent + '  ';
	for (const node of list.children) {
		const name = tag(node);
		// Google Docs puts a nested list beside its parent item rather than inside it.
		if (name === 'ul' || name === 'ol') {
			out.push(...listLines(node, childIndent));
			continue;
		}
		if (name !== 'li') continue;
		const marker = ordered ? `${++n}. ` : '- ';
		childIndent = indent + ' '.repeat(marker.length);
		const own = [...node.childNodes].filter((c) => tag(c) !== 'ul' && tag(c) !== 'ol');
		out.push(`${indent}${marker}${paragraph(own)}`);
		for (const sub of node.children) {
			if (tag(sub) === 'ul' || tag(sub) === 'ol') out.push(...listLines(sub, childIndent));
		}
	}
	return out;
}

/** Inline nodes as one paragraph, its text guarded against reading as a heading or list. */
function paragraph(nodes: Node[]): string {
	const text = lines(nodes.map((node) => inline(node, {})).join(''));
	return text.replace(/^(#{1,6}\s|[-+>]\s|\d+[.)]\s)/gm, (m) =>
		/^\d/.test(m) ? m.replace(/[.)]/, '\\$&') : `\\${m}`
	);
}

/** Collapses whitespace as HTML does; '\n' (a <br>) becomes a markdown hard line break. */
function lines(text: string): string {
	return text
		.split('\n')
		.map((line) => line.replace(/ {2,}/g, ' ').trim())
		.filter(Boolean)
		.join('  \n');
}

interface Marks {
	bold?: boolean;
	italic?: boolean;
}

function inline(node: Node, marks: Marks): string {
	if (node.nodeType === Node.TEXT_NODE) {
		return (node.textContent ?? '').replace(/\s+/g, ' ').replace(/[\\`*_[\]]/g, '\\$&');
	}
	if (!(node instanceof Element)) return '';
	const name = tag(node);
	if (SKIPPED.has(name)) return '';
	if (name === 'br') return '\n';

	const style = node.getAttribute('style') ?? '';
	const weight = /font-weight:\s*(\w+)/i.exec(style)?.[1];
	const bold = weight
		? weight === 'bold' || Number(weight) >= 600
		: name === 'b' || name === 'strong';
	const fontStyle = /font-style:\s*(\w+)/i.exec(style)?.[1];
	const italic = fontStyle ? fontStyle === 'italic' : name === 'i' || name === 'em';
	// Google Docs wraps a whole paste in <b style="font-weight:normal">: not bold, and inner
	// marks stay off when the outer one already applies (no "****").
	const inner: Marks = { bold: marks.bold || bold, italic: marks.italic || italic };
	let text = [...node.childNodes].map((child) => inline(child, inner)).join('');

	if (name === 'a') {
		const href = safeHref(node.getAttribute('href') ?? '');
		if (href && text.trim())
			text = `[${text.trim()}](${href.replace(/[ ()]/g, encodeURIComponent)})`;
	}
	if (italic && !marks.italic) text = wrap(text, '*');
	if (bold && !marks.bold) text = wrap(text, '**');
	if (name === 'td' || name === 'th') text += ' ';
	else if (BLOCKS.has(name)) text += '\n'; // a block inside a list item or cell
	return text;
}

/** `**foo **` isn't bold in markdown: the marker goes inside the surrounding spaces. */
function wrap(text: string, marker: string): string {
	const [, lead, core, trail] = /^(\s*)([\s\S]*?)(\s*)$/.exec(text) ?? ['', '', text, ''];
	return core ? `${lead}${marker}${core}${marker}${trail}` : text;
}
