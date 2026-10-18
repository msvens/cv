import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { MdBlock, MdInline } from '$lib/markdown';

// What the resume and the letter PDFs share, so they look alike and can later be put into one
// document (letter + CV). Layout ported from the old @react-pdf ResumePdf.tsx styles.
const MARGIN_X = 50;
const MARGIN_Y = 40;
const A4_WIDTH = 595.28;
export const CONTENT_WIDTH = A4_WIDTH - 2 * MARGIN_X;
export const TEXT = '#1a1a1a';
export const MUTED = '#555';
export const BODY = '#333';

/** Page size, margins and base text style of every PDF. */
export const PAGE = {
	pageSize: 'A4',
	pageMargins: [MARGIN_X, MARGIN_Y, MARGIN_X, MARGIN_Y],
	defaultStyle: { font: 'Helvetica', fontSize: 10, color: TEXT, lineHeight: 1.4 }
} satisfies Partial<TDocumentDefinitions>;

/** A filename-safe slug: "Martin Svensson" → "martin-svensson". */
export function fileSlug(name: string): string {
	return name
		.normalize('NFD')
		.replace(/\p{M}/gu, '') // drop the combining marks NFD splits off: å → a
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

export interface TextStyle {
	fontSize: number;
	color: string;
	/** Space after each paragraph except the last. */
	gap: number;
}

/** The safe markdown tree as pdfmake content: paragraphs, bullet/numbered lists, inline runs. */
export function markdown(blocks: MdBlock[], style: TextStyle): Content {
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
