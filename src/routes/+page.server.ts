import { buildResumeView } from '$lib/server/resume';
import { listVisibleSectionsWithItems } from '$lib/server/services/sections';
import type { PageServerLoad } from './$types';

// The profile and language come from the root layout's load; the page resolves the resume
// for that language on the server, so components only receive plain strings.
export const load: PageServerLoad = async ({ parent }) => {
	const [{ profile, lang }, sections] = await Promise.all([
		parent(),
		listVisibleSectionsWithItems()
	]);
	return { resume: profile ? buildResumeView(profile, sections, lang) : null };
};
