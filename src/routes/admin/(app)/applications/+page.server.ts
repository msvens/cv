import { redirect } from '@sveltejs/kit';
import { groupApplications, needsAttention } from '$lib/applications';
import { ownerToday } from '$lib/dates';
import { requireAdmin } from '$lib/server/auth/admin';
import { invalid, text } from '$lib/server/forms';
import { createApplication, listApplications } from '$lib/server/services/applications';
import { getSettings } from '$lib/server/services/settings';
import { newApplicationSchema } from '$lib/validation/schemas';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [applications, { attentionDays }] = await Promise.all([listApplications(), getSettings()]);
	return {
		...groupApplications(applications),
		attention: needsAttention(applications, ownerToday(), attentionDays)
	};
};

export const actions: Actions = {
	create: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const values = { company: text(form, 'company'), role: text(form, 'role') };
		const parsed = newApplicationSchema.safeParse(values);
		if (!parsed.success) return invalid(values, parsed.error);
		const id = await createApplication(parsed.data);
		redirect(303, `/admin/applications/${id}`);
	}
};
