import { describe, expect, it } from 'vitest';
import { resolveLanguage } from '../i18n';

describe('resolveLanguage', () => {
	it.each(['en', 'sv'] as const)('keeps a valid %s', (lang) => {
		expect(resolveLanguage(lang)).toBe(lang);
	});

	it.each([undefined, '', 'de', 'SV'])('falls back to en for %j', (value) => {
		expect(resolveLanguage(value)).toBe('en');
	});
});
