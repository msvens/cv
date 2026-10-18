/** Every node in a pdfmake content tree, depth first. */
export function nodes(content: unknown): Record<string, unknown>[] {
	if (Array.isArray(content)) return content.flatMap(nodes);
	if (content === null || typeof content !== 'object') return [];
	const node = content as Record<string, unknown>;
	return [node, ...Object.values(node).flatMap(nodes)];
}

/** All text in a content tree, concatenated. */
export function text(content: unknown): string {
	if (typeof content === 'string') return content;
	if (Array.isArray(content)) return content.map(text).join('');
	if (content && typeof content === 'object') {
		const node = content as Record<string, unknown>;
		return ['text', 'stack', 'columns', 'ul', 'ol'].map((k) => text(node[k])).join('');
	}
	return '';
}
