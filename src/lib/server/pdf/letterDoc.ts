import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { ResumeView } from '$lib/resume';
import type { LetterParts, Person, Recipient } from '$lib/server/letter';
import type { SocialLink } from '$lib/social';
import { buildResumeDoc, keepHeadingWithContent } from './resumeDoc';
import { BODY, MUTED, PAGE, TEXT, markdown } from './shared';

/**
 * The personal letter as a pdfmake document, in the CV's style. Pure: `parts` is already
 * resolved for the application's language. Top to bottom: the sender (optional), the recipient
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

/**
 * The letter followed by the CV, from a new page, as one pdfmake document: pdfmake can't merge
 * finished PDFs. The CV is built in the letter's (the application's) language (R7), never the visitor's. The CV's
 * orphan-heading rule applies to the whole document; only CV section headings trigger it.
 */
export function buildLetterWithCvDoc(
	parts: LetterParts,
	view: ResumeView,
	links: SocialLink[]
): TDocumentDefinitions {
	const cv = buildResumeDoc(view, links, parts.lang);
	return {
		...PAGE,
		pageBreakBefore: keepHeadingWithContent,
		content: [
			...asArray(buildLetterDoc(parts).content),
			{ stack: asArray(cv.content), pageBreak: 'before' }
		]
	};
}

/** Both builders return an array; pdfmake's type also allows a single node. */
function asArray(content: Content): Content[] {
	return Array.isArray(content) ? content : [content];
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
