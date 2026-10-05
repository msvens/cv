/**
 * Text edits behind the admin markdown editor's toolbar, as pure functions of the textarea's
 * value and selection, so they can be tested without a browser.
 */
export interface Edit {
	value: string;
	selectionStart: number;
	selectionEnd: number;
}

/**
 * Wrap the selection in `before`/`after` (e.g. `**` for bold). With nothing selected,
 * `placeholder` is inserted and selected, ready to be typed over; with a selection, the
 * wrapped text stays selected.
 */
export function wrapSelection(
	value: string,
	start: number,
	end: number,
	before: string,
	after: string,
	placeholder: string
): Edit {
	const text = value.slice(start, end) || placeholder;
	const selectionStart = start + before.length;
	return {
		value: value.slice(0, start) + before + text + after + value.slice(end),
		selectionStart,
		selectionEnd: selectionStart + text.length
	};
}

/** A line's leading markdown marker: heading hashes, a bullet or a number (after any indent). */
const LINE_MARKER = /^(#{1,6} |[-*+] |\d+\. )/;

/**
 * Give the cursor's line the marker `prefix` ("# ", "- ", "1. " …), replacing any marker it
 * already has — so H1 → H2 doesn't stack into "## # ". Applying the same marker again removes
 * it (a toggle). Indentation is kept; the cursor stays on the same text.
 */
export function prefixLine(value: string, cursor: number, prefix: string): Edit {
	const lineStart = value.lastIndexOf('\n', cursor - 1) + 1;
	const indent = /^[ \t]*/.exec(value.slice(lineStart))?.[0] ?? '';
	const contentStart = lineStart + indent.length;
	const existing = LINE_MARKER.exec(value.slice(contentStart))?.[0] ?? '';
	const replacement = existing === prefix ? '' : prefix;
	const shift = replacement.length - existing.length;
	const position = Math.max(contentStart + replacement.length, cursor + shift);
	return {
		value: value.slice(0, contentStart) + replacement + value.slice(contentStart + existing.length),
		selectionStart: position,
		selectionEnd: position
	};
}
