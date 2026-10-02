/**
 * Markdown as a small tree of allowed elements. The server parses admin-written markdown into
 * this tree (`$lib/server/markdown.ts`) and `Markdown.svelte` renders it element by element, so
 * text is always escaped by Svelte and no HTML string is ever inserted.
 */
export type MdInline =
	| { kind: 'text'; text: string }
	| { kind: 'strong'; children: MdInline[] }
	| { kind: 'em'; children: MdInline[] }
	| { kind: 'code'; text: string }
	| { kind: 'br' }
	| { kind: 'link'; href: string; children: MdInline[] };

export type MdBlock =
	| { kind: 'paragraph'; children: MdInline[] }
	/** A tight list item's content: inline, without a wrapping <p>. */
	| { kind: 'plain'; children: MdInline[] }
	| { kind: 'list'; ordered: boolean; items: MdBlock[][] };

const SAFE_SCHEME = /^(https?|mailto):/i;

/**
 * The href if it is safe to put in a link, else null. Only absolute http(s) and mailto URLs
 * pass — an allowlist, so `javascript:`, `data:` and anything a browser might reinterpret are
 * rejected without having to enumerate them.
 */
export function safeHref(href: string): string | null {
	const trimmed = href.trim();
	return SAFE_SCHEME.test(trimmed) ? trimmed : null;
}
