import type { Column, Content, Node, NodeQueries, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { Language } from '$lib/i18n';
import type { MdBlock, MdInline } from '$lib/markdown';
import type { EntryView, ResumeView, SectionView } from '$lib/resume';
import type { SocialLink } from '$lib/social';
import { getTranslation } from '$lib/translations';

// Layout ported from the old @react-pdf ResumePdf.tsx styles.
const MARGIN_X = 50;
const MARGIN_Y = 40;
const A4_WIDTH = 595.28;
const CONTENT_WIDTH = A4_WIDTH - 2 * MARGIN_X;
const TEXT = '#1a1a1a';
const MUTED = '#555';
const BODY = '#333';
/** Keeps a chip's text and padding on one line. */
const NBSP = '\u00a0';

/**
 * The resume as a pdfmake document. Pure: takes the same `ResumeView` the web page renders
 * (already resolved for `lang`, markdown parsed, links checked) so the PDF can't drift from
 * the page's content rules.
 */
export function buildResumeDoc(
	view: ResumeView,
	links: SocialLink[],
	lang: Language
): TDocumentDefinitions {
	const t = getTranslation(lang).pdf;
	return {
		pageSize: 'A4',
		pageMargins: [MARGIN_X, MARGIN_Y, MARGIN_X, MARGIN_Y],
		defaultStyle: { font: 'Helvetica', fontSize: 10, color: TEXT, lineHeight: 1.4 },
		pageBreakBefore: keepHeadingWithContent,
		content: [
			header(view, links),
			section(t.profile, markdown(view.header.bio, { fontSize: 10, color: BODY, gap: 6 })),
			...view.sections.map((s) => section(s.label, sectionBody(s)))
		]
	};
}

/** Marks section titles for `keepHeadingWithContent`. */
const SECTION_HEADING = 1;

/**
 * pdfmake's page-break hook: move a section heading to the next page when nothing of its
 * section would follow it on this one, so a page never ends with an orphaned heading. The
 * heading's rule (a canvas line) and bare container stacks don't count as content.
 */
export function keepHeadingWithContent(node: Node, nodes: NodeQueries): boolean {
	return (
		node.headlineLevel === SECTION_HEADING &&
		!nodes.getFollowingNodesOnPage().some((n) => !n.canvas && !n.stack)
	);
}

/** A filename-safe slug: "Martin Svensson" → "martin-svensson". */
export function fileSlug(name: string): string {
	return name
		.normalize('NFD')
		.replace(/\p{M}/gu, '') // drop the combining marks NFD splits off: å → a
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

function header(view: ResumeView, links: SocialLink[]): Content {
	const { name, title, email, location, phone } = view.header;
	const contact: Content[] = [
		email,
		location,
		...links.map((l) => ({ text: l.label, link: l.href })),
		...(phone ? [phone] : [])
	];
	return {
		stack: [
			{
				text: name.toUpperCase(),
				bold: true,
				fontSize: 18,
				characterSpacing: 3,
				margin: [0, 0, 0, 6]
			},
			{ text: title, fontSize: 11, color: MUTED, margin: [0, 0, 0, 6] },
			{ text: separated(contact), fontSize: 9, color: MUTED }
		],
		alignment: 'center',
		margin: [0, 0, 0, 20]
	};
}

/** Contact items on one line, separated like the old row's gaps. */
function separated(items: Content[]): Content[] {
	return items.flatMap((item, i) => (i === 0 ? [item] : ['    ', item]));
}

function section(label: string, body: Content): Content {
	return {
		stack: [
			{
				text: label.toUpperCase(),
				bold: true,
				fontSize: 11,
				characterSpacing: 2,
				headlineLevel: SECTION_HEADING
			},
			{
				canvas: [
					{
						type: 'line',
						x1: 0,
						y1: 3,
						x2: CONTENT_WIDTH,
						y2: 3,
						lineWidth: 0.5,
						lineColor: '#ccc'
					}
				],
				margin: [0, 0, 0, 8]
			},
			body
		],
		margin: [0, 0, 0, 14]
	};
}

function sectionBody(section: SectionView): Content {
	if (section.kind === 'chips') {
		return {
			// pdfmake has no wrapping inline boxes; a shaded run per chip approximates them.
			// Non-breaking spaces inside a chip keep it on one line: lines break between chips.
			text: section.chips.flatMap((chip, i) => [
				...(i > 0 ? ['  '] : []),
				{ text: `${NBSP}${chip.replaceAll(' ', NBSP)}${NBSP}`, background: '#f3f3f3' }
			]),
			fontSize: 9,
			color: BODY,
			lineHeight: 1.6
		};
	}
	return { stack: section.entries.map(entry), margin: [0, 0, 0, 0] };
}

function entry(item: EntryView): Content {
	// The whole "Title — Subtitle" line is bold, as in the old PDF; only the title is linked.
	const title: Content = item.link ? { text: item.title, link: item.link } : item.title;
	const left: Column = {
		width: '*',
		bold: true,
		text: [title, ...(item.subtitle ? [` — ${item.subtitle}`] : [])]
	};
	const date: Column[] = item.dateRange
		? [{ width: 'auto', text: item.dateRange, fontSize: 9, color: MUTED, alignment: 'right' }]
		: [];
	const heading: Content = { columns: [left, ...date], columnGap: 10, margin: [0, 0, 0, 2] };
	return {
		stack: [
			heading,
			...(item.description
				? [markdown(item.description, { fontSize: 9, color: BODY, gap: 4 })]
				: [])
		],
		// An entry is never split across pages: if it doesn't fit, it moves to the next page
		// whole (pdfmake still splits one that is longer than a page).
		unbreakable: true,
		margin: [0, 0, 0, 10]
	};
}

interface TextStyle {
	fontSize: number;
	color: string;
	/** Space after each paragraph except the last. */
	gap: number;
}

/** The safe markdown tree as pdfmake content: paragraphs, bullet/numbered lists, inline runs. */
function markdown(blocks: MdBlock[], style: TextStyle): Content {
	return {
		stack: blocks.map((block, i) => mdBlock(block, i === blocks.length - 1 ? 0 : style.gap)),
		fontSize: style.fontSize,
		color: style.color,
		lineHeight: 1.5
	};
}

function mdBlock(block: MdBlock, gapAfter: number): Content {
	switch (block.kind) {
		case 'paragraph':
			return { text: mdInlines(block.children), margin: [0, 0, 0, gapAfter] };
		case 'plain':
			return { text: mdInlines(block.children) };
		case 'heading':
			// Subheadings within the body text: bold, a step larger for # and ##.
			return {
				text: mdInlines(block.children),
				bold: true,
				fontSize: block.level === 3 ? undefined : 10 + (3 - block.level),
				margin: [0, 4, 0, 2]
			};
		case 'list': {
			const items = block.items.map((item) =>
				item.length === 1 ? mdBlock(item[0], 0) : { stack: item.map((b) => mdBlock(b, 0)) }
			);
			return block.ordered
				? { ol: items, margin: [0, 0, 0, gapAfter] }
				: { ul: items, margin: [0, 0, 0, gapAfter] };
		}
	}
}

function mdInlines(nodes: MdInline[]): Content[] {
	return nodes.map((node): Content => {
		switch (node.kind) {
			case 'text':
			case 'code': // only Helvetica is embedded, so code is plain text
				return node.text;
			case 'strong':
				return { text: mdInlines(node.children), bold: true };
			case 'em':
				return { text: mdInlines(node.children), italics: true };
			case 'br':
				return '\n';
			case 'link':
				return { text: mdInlines(node.children), link: node.href, color: '#1a56db' };
		}
	});
}
