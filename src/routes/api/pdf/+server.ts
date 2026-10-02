import { error } from '@sveltejs/kit';
import { resolveLanguage } from '$lib/i18n';
import { buildResumeDoc, fileSlug } from '$lib/server/pdf/resumeDoc';
import { renderPdf } from '$lib/server/pdf/render';
import { buildResumeView } from '$lib/server/resume';
import { getProfile } from '$lib/server/services/profile';
import { listPdfSectionsWithItems } from '$lib/server/services/sections';
import { socialLinks } from '$lib/social';
import type { RequestHandler } from './$types';

/** The resume as a downloadable PDF: `?lang=sv` for Swedish, anything else English. */
export const GET: RequestHandler = async ({ url }) => {
	const lang = resolveLanguage(url.searchParams.get('lang') ?? undefined);
	const [profile, sections] = await Promise.all([getProfile(), listPdfSectionsWithItems()]);
	if (!profile) error(404, 'Profile not found');

	const view = buildResumeView(profile, sections, lang);
	const pdf = await renderPdf(buildResumeDoc(view, socialLinks(profile), lang));

	return new Response(new Uint8Array(pdf), {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename="${fileSlug(profile.name)}-resume-${lang}.pdf"`,
			// Never cached: downloading again right after an edit must show the edit.
			'Cache-Control': 'no-store'
		}
	});
};
