import { describe, expect, it } from 'vitest';
import { socialLinks } from '../social';

/** A profile's link fields; both links shown unless a test says otherwise. */
const links = (
	github: string | null,
	linkedin: string | null,
	show: { showGithub?: boolean; showLinkedin?: boolean } = {}
) => socialLinks({ github, linkedin, showGithub: true, showLinkedin: true, ...show });

describe('socialLinks', () => {
	it('builds both URLs from usernames, GitHub first', () => {
		expect(links('msvens', 'msvens')).toEqual([
			{ label: 'GitHub', href: 'https://github.com/msvens' },
			{ label: 'LinkedIn', href: 'https://linkedin.com/in/msvens' }
		]);
	});

	it.each([null, '', '   '])('leaves out a %j username', (empty) => {
		expect(links(empty, empty)).toEqual([]);
	});

	// Each link comes only from its own field — one is never derived from the other.
	it('shows GitHub alone when LinkedIn is empty', () => {
		expect(links('msvens', null)).toEqual([{ label: 'GitHub', href: 'https://github.com/msvens' }]);
	});

	it('shows LinkedIn alone when GitHub is empty', () => {
		expect(links(null, 'someone-else')).toEqual([
			{ label: 'LinkedIn', href: 'https://linkedin.com/in/someone-else' }
		]);
	});

	it('trims stray whitespace', () => {
		expect(links(' msvens ', null)[0].href).toBe('https://github.com/msvens');
	});

	it('returns no links without a profile', () => {
		expect(socialLinks(null)).toEqual([]);
	});

	// The switch hides a link while its username stays stored (so github can stay filled).
	it('hides a link whose switch is off, even with a username', () => {
		expect(links('msvens', 'msvens', { showGithub: false })).toEqual([
			{ label: 'LinkedIn', href: 'https://linkedin.com/in/msvens' }
		]);
		expect(links('msvens', 'msvens', { showGithub: false, showLinkedin: false })).toEqual([]);
	});
});
