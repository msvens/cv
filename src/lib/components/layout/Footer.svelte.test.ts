import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import type { Language } from '$lib/i18n';
import type { SocialLink } from '$lib/social';
import Footer from './Footer.svelte';

interface ProfileProps {
	name: string | null;
	links: SocialLink[];
	updatedAt: Date | null;
}

const profileProps: ProfileProps = {
	name: 'Martin Svensson',
	links: [{ label: 'GitHub', href: 'https://github.com/msvens' }],
	updatedAt: new Date('2026-04-22T07:51:59Z')
};

function renderFooter(lang: Language = 'en', props: ProfileProps = profileProps) {
	return render(Footer, { props: { lang, ...props } });
}

describe('Footer', () => {
	it("shows the owner's name", () => {
		renderFooter();
		expect(screen.getByText('Martin Svensson')).toBeInTheDocument();
	});

	it('opens the social links in a new tab', () => {
		renderFooter();
		const github = screen.getByRole('link', { name: 'GitHub' });
		expect(github).toHaveAttribute('href', 'https://github.com/msvens');
		expect(github).toHaveAttribute('target', '_blank');
		expect(github).toHaveAttribute('rel', 'noopener noreferrer');
	});

	it('links to the admin', () => {
		renderFooter();
		expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin');
	});

	// Not the current month: the old app showed new Date() at render time.
	it('shows when the profile was last updated, in the page language', () => {
		renderFooter('en');
		expect(screen.getByText('Updated Apr 2026')).toBeInTheDocument();
	});

	it('shows the date in Swedish in the Swedish UI', () => {
		renderFooter('sv');
		expect(screen.getByText('Uppdaterad apr. 2026')).toBeInTheDocument();
	});

	it('still links to the admin without a profile', () => {
		renderFooter('en', { name: null, links: [], updatedAt: null });
		expect(screen.getByRole('link', { name: 'Admin' })).toBeInTheDocument();
		expect(screen.queryByText('Martin Svensson')).not.toBeInTheDocument();
		expect(screen.queryByText(/updated/i)).not.toBeInTheDocument();
		expect(screen.queryByText('·')).not.toBeInTheDocument();
	});
});
