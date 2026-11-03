import { error } from '@sveltejs/kit';
import { resolveLanguage } from '$lib/i18n';
import { cvPdf } from '$lib/server/applicationPdf';
import type { RequestHandler } from './$types';

/** The resume as a downloadable PDF: `?lang=sv` for Swedish, anything else English. */
export const GET: RequestHandler = async ({ url }) => {
	const rendered = await cvPdf(resolveLanguage(url.searchParams.get('lang') ?? undefined));
	if (!rendered) error(404, 'Profile not found');

	return new Response(new Uint8Array(rendered.pdf), {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename="${rendered.filename}"`,
			// Never cached: downloading again right after an edit must show the edit.
			'Cache-Control': 'no-store'
		}
	});
};
