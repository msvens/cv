import { needsAttention } from '$lib/applications';
import { ownerToday } from '$lib/dates';
import { isAdmin } from '$lib/server/auth/admin';
import { listApplications } from '$lib/server/services/applications';
import { getProfile } from '$lib/server/services/profile';
import { getSettings } from '$lib/server/services/settings';
import type { LayoutServerLoad } from './$types';

/**
 * What needs attention (R5), for the admin nav and the front-page notice: how many, and when it
 * is exactly one, which one, so the notice can link straight to it.
 */
async function attentionSummary() {
	const [applications, { attentionDays }] = await Promise.all([listApplications(), getSettings()]);
	const due = needsAttention(applications, ownerToday(), attentionDays);
	const only = due.length === 1 ? due[0].application : null;
	return {
		count: due.length,
		only: only && { id: only.id, company: only.company, role: only.role }
	};
}

// The profile is loaded here because the shell (TopBar, Footer) needs it on every page;
// pages read it from the merged layout data instead of querying it again. The attention summary
// is private: it is computed for the admin only, everyone else gets null and no query runs.
export const load: LayoutServerLoad = async ({ locals }) => {
	const [profile, attention] = await Promise.all([
		getProfile(),
		isAdmin(locals.user) ? attentionSummary() : null
	]);
	return { lang: locals.lang, profile, attention };
};
