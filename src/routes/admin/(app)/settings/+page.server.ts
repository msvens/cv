import { requireAdmin } from '$lib/server/auth/admin';
import { invalid, text } from '$lib/server/forms';
import { getSettings, updateSettings } from '$lib/server/services/settings';
import { settingsSchema } from '$lib/validation/schemas';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({ settings: await getSettings() });

export const actions: Actions = {
	save: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const values = { attentionDays: text(form, 'attentionDays') };
		const parsed = settingsSchema.safeParse(values);
		if (!parsed.success) return invalid(values, parsed.error);
		await updateSettings(parsed.data);
		return { message: 'Settings saved.' };
	}
};
