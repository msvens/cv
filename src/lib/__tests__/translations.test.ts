import { describe, expect, it } from 'vitest';
import type { Language } from '$lib/i18n';
import { getTranslation } from '$lib/translations';

/** Every leaf of a nested translations object, as `[dot.path, value]` pairs. */
function collectLeaves(obj: object, prefix = ''): [string, unknown][] {
	return Object.entries(obj).flatMap(([key, value]) => {
		const path = prefix ? `${prefix}.${key}` : key;
		return typeof value === 'object' && value !== null
			? collectLeaves(value, path)
			: [[path, value] as [string, unknown]];
	});
}

const paths = (lang: Language) =>
	collectLeaves(getTranslation(lang))
		.map(([path]) => path)
		.sort();

describe('translations', () => {
	// Both objects are typed `Translations`, so a missing key is already a type error;
	// this guards the runtime shape if that typing is ever loosened.
	it('has identical keys in en and sv', () => {
		expect(paths('sv')).toEqual(paths('en'));
	});

	it.each<Language>(['en', 'sv'])('has no empty strings in %s', (lang) => {
		for (const [path, value] of collectLeaves(getTranslation(lang))) {
			expect(value, `${lang}.${path}`).toBeTypeOf('string');
			expect(value, `${lang}.${path}`).not.toBe('');
		}
	});
});
