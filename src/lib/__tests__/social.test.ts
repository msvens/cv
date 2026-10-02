import { describe, expect, it } from 'vitest';
import { socialLinks } from '../social';

describe('socialLinks', () => {
	it('builds both URLs from usernames, GitHub first', () => {
		expect(socialLinks({ github: 'msvens', linkedin: 'msvens' })).toEqual([
			{ label: 'GitHub', href: 'https://github.com/msvens' },
			{ label: 'LinkedIn', href: 'https://linkedin.com/in/msvens' }
		]);
	});

	it.each([null, '', '   '])('leaves out a %j username', (empty) => {
		expect(socialLinks({ github: empty, linkedin: empty })).toEqual([]);
	});

	// Each link comes only from its own field — one is never derived from the other.
	it('shows GitHub alone when LinkedIn is empty', () => {
		expect(socialLinks({ github: 'msvens', linkedin: null })).toEqual([
			{ label: 'GitHub', href: 'https://github.com/msvens' }
		]);
	});

	it('shows LinkedIn alone when GitHub is empty', () => {
		expect(socialLinks({ github: null, linkedin: 'someone-else' })).toEqual([
			{ label: 'LinkedIn', href: 'https://linkedin.com/in/someone-else' }
		]);
	});

	it('trims stray whitespace', () => {
		expect(socialLinks({ github: ' msvens ', linkedin: null })[0].href).toBe(
			'https://github.com/msvens'
		);
	});

	it('returns no links without a profile', () => {
		expect(socialLinks(null)).toEqual([]);
	});
});
