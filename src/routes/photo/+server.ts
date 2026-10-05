import { error } from '@sveltejs/kit';
import { getPhoto } from '$lib/server/services/photo';
import type { RequestHandler } from './$types';

/**
 * The uploaded profile photo. Its URL carries a content version (/photo?v=…), so each version
 * can be cached for good: a new upload gets a new URL.
 */
export const GET: RequestHandler = async () => {
	const photo = await getPhoto();
	if (!photo) error(404, 'No photo');
	return new Response(new Uint8Array(photo.data), {
		headers: {
			'Content-Type': photo.contentType,
			'Cache-Control': 'public, max-age=31536000, immutable'
		}
	});
};
