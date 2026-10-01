import { getProfile } from '$lib/server/services/profile';
import { listVisibleSectionsWithItems } from '$lib/server/services/sections';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [profile, sections] = await Promise.all([getProfile(), listVisibleSectionsWithItems()]);
	return { profile, sections };
};
