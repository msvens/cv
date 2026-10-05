import { marked, type Token, type Tokens } from 'marked';
import { safeHref, type MdBlock, type MdInline } from '$lib/markdown';

/**
 * Parse admin-written markdown into the allowed-element tree rendered by `Markdown.svelte`.
 *
 * This is an allowlist: paragraphs, headings (levels 1–3), lists, bold, italics, inline code,
 * line breaks and safe links survive; everything else is reduced to its text. Raw HTML in particular comes back as
 * literal text (as the old react-markdown rendering escaped it), so `<script>` is shown, never
 * run. CommonMark only (`gfm: false`), matching the old app, which ran without remark-gfm.
 *
 * Runs on the server for the public page and PDF, and in the browser only for the admin's
 * markdown preview: public pages never import it client-side, so `marked` stays out of their
 * bundle.
 */
export function parseMarkdown(md: string): MdBlock[] {
	return toBlocks(marked.lexer(md, { gfm: false }));
}

function toBlocks(tokens: Token[]): MdBlock[] {
	return tokens.flatMap(toBlock);
}

function toBlock(token: Token): MdBlock[] {
	switch (token.type) {
		case 'paragraph':
			return [{ kind: 'paragraph', children: toInlines(token.tokens ?? []) }];
		case 'heading':
			return [
				{
					kind: 'heading',
					level: token.depth <= 1 ? 1 : token.depth === 2 ? 2 : 3,
					children: toInlines(token.tokens ?? [])
				}
			];
		case 'list':
			return [
				{
					kind: 'list',
					ordered: token.ordered,
					items: token.items.map((item: Tokens.ListItem) => toBlocks(item.tokens))
				}
			];
		case 'text': // a tight list item's content
			return [{ kind: 'plain', children: toInlines([token]) }];
		case 'blockquote':
			return toBlocks(token.tokens ?? []);
		case 'code':
		case 'html':
			return [{ kind: 'paragraph', children: [{ kind: 'text', text: token.text.trim() }] }];
		default: // space, hr, link definitions
			return [];
	}
}

function toInlines(tokens: Token[]): MdInline[] {
	return tokens.flatMap(toInline);
}

function toInline(token: Token): MdInline[] {
	switch (token.type) {
		case 'text':
			return token.tokens ? toInlines(token.tokens) : [{ kind: 'text', text: token.text }];
		case 'strong':
		case 'em':
			return [{ kind: token.type, children: toInlines(token.tokens ?? []) }];
		case 'codespan':
			return [{ kind: 'code', text: token.text }];
		case 'br':
			return [{ kind: 'br' }];
		case 'link': {
			// An unsafe link loses its href but keeps its words.
			const href = safeHref(token.href);
			const children = toInlines(token.tokens ?? []);
			return href ? [{ kind: 'link', href, children }] : children;
		}
		default: // escape, html, image (its alt text), del, …: text only
			return 'text' in token && typeof token.text === 'string'
				? [{ kind: 'text', text: token.text }]
				: [];
	}
}
