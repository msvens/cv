import { needsAttention } from '$lib/applications';
import { ownerToday } from '$lib/dates';
import { requireAdmin } from '$lib/server/auth/admin';
import { listApplications } from '$lib/server/services/applications';
import { getSettings } from '$lib/server/services/settings';
import type { LayoutServerLoad } from './$types';

// The hook's adminGuard already redirects; this keeps the admin pages safe on their own. Loads
// rerun after every enhanced form submit, so the nav's count stays current.
export const load: LayoutServerLoad = async (event) => {
	requireAdmin(event);
	const [applications, { attentionDays }] = await Promise.all([listApplications(), getSettings()]);
	return { attentionCount: needsAttention(applications, ownerToday(), attentionDays).length };
};
