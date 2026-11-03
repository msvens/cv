import { error } from '@sveltejs/kit';
import { applicationId } from '$lib/server/applicationForms';
import { letterPdf } from '$lib/server/applicationPdf';
import { requireAdmin } from '$lib/server/auth/admin';
import type { RequestHandler } from './$types';

/**
 * The saved letter as a PDF, opened in the browser: the letter alone, or with the CV attached.
 * Layout loads don't run for endpoints, so this checks the admin itself. Its language is the
 * application's, never the visitor's (R7): nothing here reads `locals.lang` or the cookie.
 */
export const GET: RequestHandler = async (event) => {
	requireAdmin(event);
	const rendered = await letterPdf(applicationId(event.params.id));
	if (!rendered) error(404, 'No such letter');

	return new Response(new Uint8Array(rendered.pdf), {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `inline; filename="${rendered.filename}"`,
			'Cache-Control': 'no-store'
		}
	});
};
