import { db } from '$lib/server/db/client';
import { settings } from '$lib/server/db/schema';
import { SETTINGS_DEFAULTS, type Settings } from '$lib/settings';
import type { SettingsInput } from '$lib/validation/schemas';

/** The saved settings, or the defaults while nothing has been saved. */
export async function getSettings(): Promise<Settings> {
	const [row] = await db.select().from(settings);
	return row ? { attentionDays: row.attentionDays } : { ...SETTINGS_DEFAULTS };
}

/** Saves the settings: creates the single row the first time, updates it after that. */
export async function updateSettings(input: SettingsInput): Promise<void> {
	await db
		.insert(settings)
		.values({ id: 1, ...input })
		.onConflictDoUpdate({ target: settings.id, set: input });
}
