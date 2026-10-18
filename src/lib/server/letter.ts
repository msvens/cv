import { resolveLanguage, type Language } from '$lib/i18n';
import type { MdBlock } from '$lib/markdown';
import { parseMarkdown } from '$lib/markdownParse';
import type { ApplicationContact, ApplicationData, Letter, ProfileData } from '$lib/types';

/** The letter's sender: the profile's details, in the letter's language. */
export interface Person {
	name: string;
	title: string;
	email: string;
	phone: string | null;
	location: string;
}

/** Who the letter is to: the company, and optionally one of the application's contacts. */
export interface Recipient {
	company: string;
	name: string | null;
	role: string | null;
}

/** A letter resolved for its own language: what `buildLetterDoc` lays out. */
export interface LetterParts {
	lang: Language;
	sender: Person | null;
	recipient: Recipient | null;
	body: MdBlock[];
}

/**
 * Everything language-dependent in a letter is decided here, by the letter's own language and
 * never the visitor's (R7): the profile's title and location. The recipient contact is looked up
 * among this application's contacts only.
 */
export function letterParts(
	letter: Letter,
	application: ApplicationData,
	contacts: ApplicationContact[],
	profile: ProfileData
): LetterParts {
	const lang = resolveLanguage(letter.language);
	const sv = lang === 'sv';
	const contact = contacts.find(
		(c) => c.id === letter.recipientContactId && c.applicationId === application.id
	);
	return {
		lang,
		sender: letter.includeContact
			? {
					name: profile.name,
					title: sv ? profile.titleSv : profile.titleEn,
					email: profile.email,
					phone: profile.phone?.trim() ? profile.phone : null,
					location: sv ? profile.locationSv : profile.locationEn
				}
			: null,
		recipient: letter.includeRecipient
			? {
					company: application.company,
					name: contact?.name ?? null,
					role: contact?.role ?? null
				}
			: null,
		body: parseMarkdown(letter.body)
	};
}
