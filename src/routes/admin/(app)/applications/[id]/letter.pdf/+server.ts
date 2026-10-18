import { error } from '@sveltejs/kit';
import { applicationId } from '$lib/server/applicationForms';
import { requireAdmin } from '$lib/server/auth/admin';
import { letterParts } from '$lib/server/letter';
import { buildLetterDoc } from '$lib/server/pdf/letterDoc';
import { renderPdf } from '$lib/server/pdf/render';
import { fileSlug } from '$lib/server/pdf/shared';
import { getApplication, listContacts } from '$lib/server/services/applications';
import { getLetter } from '$lib/server/services/letters';
import { getProfile } from '$lib/server/services/profile';
import type { RequestHandler } from './$types';

/**
 * The saved letter as a PDF, opened in the browser. Layout loads don't run for endpoints, so
 * this checks the admin itself. Its language is the letter's, never the visitor's (R7): nothing
 * here reads `locals.lang` or the cookie.
 */
export const GET: RequestHandler = async (event) => {
	requireAdmin(event);
	const id = applicationId(event.params.id);
	const [application, contacts, letter, profile] = await Promise.all([
		getApplication(id),
		listContacts(id),
		getLetter(id),
		getProfile()
	]);
	if (!application || !letter) error(404, 'No such letter');
	if (!profile) error(404, 'Profile not found');

	const parts = letterParts(letter, application, contacts, profile);
	const pdf = await renderPdf(buildLetterDoc(parts));
	const filename = `${fileSlug(profile.name)}-letter-${fileSlug(application.company)}.pdf`;

	return new Response(new Uint8Array(pdf), {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `inline; filename="${filename}"`,
			'Cache-Control': 'no-store'
		}
	});
};
