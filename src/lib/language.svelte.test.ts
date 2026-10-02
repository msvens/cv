import { invalidateAll } from '$app/navigation';
import { beforeEach, expect, it, vi } from 'vitest';
import { setLanguage } from './language';

vi.mock('$app/navigation', () => ({ invalidateAll: vi.fn(() => Promise.resolve()) }));

beforeEach(() => {
	vi.mocked(invalidateAll).mockClear();
	document.cookie = 'lang=; max-age=0; path=/';
});

it('stores the language in the lang cookie and re-runs the server loads', async () => {
	await setLanguage('sv');
	expect(document.cookie).toContain('lang=sv');
	expect(invalidateAll).toHaveBeenCalledOnce();
});
