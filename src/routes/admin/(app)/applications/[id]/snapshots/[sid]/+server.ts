import { error } from '@sveltejs/kit';
import { applicationId } from '$lib/server/applicationForms';
import { requireAdmin } from '$lib/server/auth/admin';
import { getSnapshot } from '$lib/server/services/snapshots';
import type { RequestHandler } from './$types';

/**
 * A saved snapshot's PDF, byte for byte as it was stored (R8). Layout loads don't run for
 * endpoints, so this checks the admin itself.
 */
export const GET: RequestHandler = async (event) => {
	requireAdmin(event);
	const id = applicationId(event.params.id);
	const sid = Number(event.params.sid);
	const snapshot = Number.isInteger(sid) && sid > 0 ? await getSnapshot(id, sid) : null;
	if (!snapshot) error(404, 'No such snapshot');

	return new Response(new Uint8Array(snapshot.data), {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `inline; filename="${snapshot.filename}"`,
			'Cache-Control': 'no-store'
		}
	});
};
