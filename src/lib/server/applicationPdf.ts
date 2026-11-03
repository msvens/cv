import { resolveLanguage, type Language } from '$lib/i18n';
import type { ResumeView } from '$lib/resume';
import { letterParts } from '$lib/server/letter';
import { buildLetterDoc, buildLetterWithCvDoc } from '$lib/server/pdf/letterDoc';
import { renderPdf } from '$lib/server/pdf/render';
import { buildResumeDoc } from '$lib/server/pdf/resumeDoc';
import { fileSlug } from '$lib/server/pdf/shared';
import { buildResumeView } from '$lib/server/resume';
import { getApplication, listContacts } from '$lib/server/services/applications';
import { getLetter } from '$lib/server/services/letters';
import { getProfile } from '$lib/server/services/profile';
import { listPdfSectionsWithItems } from '$lib/server/services/sections';
import type { SnapshotKind } from '$lib/snapshots';
import { socialLinks, type SocialLink } from '$lib/social';
import type { ProfileData } from '$lib/types';

// The one place that renders the PDFs sent with an application, so a download and a snapshot of
// it (R8) can never differ. Every language is passed in explicitly: nothing here reads the
// visitor's language.

/** A rendered PDF with what a snapshot records about it. */
export interface RenderedPdf {
	pdf: Buffer;
	filename: string;
	kind: SnapshotKind;
	language: Language;
}

interface ResumeContent {
	profile: ProfileData;
	view: ResumeView;
	links: SocialLink[];
}

/** The CV's content in `lang`, as the public PDF has it; null without a profile. */
export async function resumeContent(lang: Language): Promise<ResumeContent | null> {
	const [profile, sections] = await Promise.all([getProfile(), listPdfSectionsWithItems()]);
	if (!profile) return null;
	return { profile, view: buildResumeView(profile, sections, lang), links: socialLinks(profile) };
}

/**
 * The application's letter as its saved options make it: the letter alone, or with the CV
 * attached, all in the application's language (R7). Null when the application, its letter or the
 * profile is missing.
 */
export async function letterPdf(applicationId: number): Promise<RenderedPdf | null> {
	const [application, contacts, letter, profile] = await Promise.all([
		getApplication(applicationId),
		listContacts(applicationId),
		getLetter(applicationId),
		getProfile()
	]);
	if (!application || !letter || !profile) return null;
	const parts = letterParts(letter, application, contacts, profile);
	const doc = letter.attachCv
		? buildLetterWithCvDoc(
				parts,
				buildResumeView(profile, await listPdfSectionsWithItems(), parts.lang),
				socialLinks(profile)
			)
		: buildLetterDoc(parts);
	const cv = letter.attachCv ? '-cv' : '';
	return {
		pdf: await renderPdf(doc),
		filename: `${fileSlug(profile.name)}-letter${cv}-${fileSlug(application.company)}.pdf`,
		kind: letter.attachCv ? 'letter+cv' : 'letter',
		language: parts.lang
	};
}

/** The CV alone, in `lang`; null without a profile. */
export async function cvPdf(lang: Language): Promise<RenderedPdf | null> {
	const resume = await resumeContent(lang);
	if (!resume) return null;
	return {
		pdf: await renderPdf(buildResumeDoc(resume.view, resume.links, lang)),
		filename: `${fileSlug(resume.profile.name)}-resume-${lang}.pdf`,
		kind: 'cv',
		language: lang
	};
}

/** The CV alone in the application's language: what was sent without a letter. */
export async function applicationCvPdf(applicationId: number): Promise<RenderedPdf | null> {
	const application = await getApplication(applicationId);
	return application ? cvPdf(resolveLanguage(application.language)) : null;
}
