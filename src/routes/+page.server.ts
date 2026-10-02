import { listVisibleSectionsWithItems } from '$lib/server/services/sections';
import type { PageServerLoad } from './$types';

// The profile comes from the root layout's load.
export const load: PageServerLoad = async () => ({
	sections: await listVisibleSectionsWithItems()
});
