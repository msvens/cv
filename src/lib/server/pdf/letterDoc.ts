import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { LetterParts, Person, Recipient } from '$lib/server/letter';
import { BODY, MUTED, PAGE, TEXT, markdown } from './shared';

/**
 * The personal letter as a pdfmake document, in the CV's style. Pure: `parts` is already
 * resolved for the letter's language. Top to bottom: the sender (optional), the recipient
 * (optional), then the body.
 */
export function buildLetterDoc(parts: LetterParts): TDocumentDefinitions {
	return {
		...PAGE,
		content: [
			...(parts.sender ? [sender(parts.sender)] : []),
			...(parts.recipient ? [recipientBlock(parts.recipient)] : []),
			markdown(parts.body, { fontSize: 10, color: BODY, gap: 8 })
		]
	};
}

/** The sender as a letter has it: left-aligned, one detail per line, the name in bold. */
function sender({ name, title, location, email, phone }: Person): Content {
	return {
		stack: [
			{ text: name, bold: true, fontSize: 10, color: TEXT },
			...[title, location, email, phone].filter((line) => line !== null)
		],
		fontSize: 9,
		color: MUTED,
		lineHeight: 1.3,
		margin: [0, 0, 0, 28]
	};
}

function recipientBlock({ company, name, role }: Recipient): Content {
	return {
		stack: [
			{ text: company, bold: true },
			...(name ? [name] : []),
			...(role ? [{ text: role, color: MUTED }] : [])
		],
		margin: [0, 0, 0, 24]
	};
}
