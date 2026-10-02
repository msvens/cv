import { invalidateAll } from '$app/navigation';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Language } from '$lib/i18n';
import type { SocialLink } from '$lib/social';
import { initTheme, theme } from '$lib/stores/theme.svelte';
import TopBar from './TopBar.svelte';

vi.mock('$app/navigation', () => ({ invalidateAll: vi.fn(() => Promise.resolve()) }));

const links: SocialLink[] = [
	{ label: 'GitHub', href: 'https://github.com/msvens' },
	{ label: 'LinkedIn', href: 'https://linkedin.com/in/msvens' }
];

function renderTopBar(lang: Language = 'en', withLinks = links) {
	return render(TopBar, { props: { lang, links: withLinks } });
}

/**
 * The mobile drawer: found by id, since `inert` hides it from role queries while closed.
 * Assertions read the `inert` property: Svelte sets the property, which browsers reflect to
 * the attribute but jsdom doesn't. (SSR emits the attribute directly.)
 */
const drawer = () => document.getElementById('mobile-menu')!;
const menuButton = () => screen.getByRole('button', { name: /^(menu|meny)$/i });

beforeEach(() => {
	vi.mocked(invalidateAll).mockClear();
	document.cookie = 'lang=; max-age=0; path=/';
	localStorage.clear();
	initTheme();
});

describe('TopBar', () => {
	it('links the brand home', () => {
		renderTopBar();
		// Desktop and mobile rows are both in the DOM; breakpoint classes pick one.
		for (const brand of screen.getAllByRole('link', { name: 'MS' })) {
			expect(brand).toHaveAttribute('href', '/');
		}
	});

	it('opens the social links in a new tab', () => {
		renderTopBar();
		for (const { label, href } of links) {
			for (const link of screen.getAllByRole('link', { name: label })) {
				expect(link).toHaveAttribute('href', href);
				expect(link).toHaveAttribute('target', '_blank');
				expect(link).toHaveAttribute('rel', 'noopener noreferrer');
			}
		}
	});

	it('renders no social links when the profile has none', () => {
		renderTopBar('en', []);
		expect(screen.queryByRole('link', { name: /github|linkedin/i })).not.toBeInTheDocument();
	});

	it('points the PDF download at the current language', () => {
		renderTopBar('sv');
		expect(screen.getAllByRole('link', { name: /pdf/i })[0]).toHaveAttribute(
			'href',
			'/api/pdf?lang=sv'
		);
	});

	it('switches to Swedish from the English UI', async () => {
		const user = userEvent.setup();
		renderTopBar('en');
		await user.click(screen.getByRole('button', { name: 'Switch to Svenska' }));
		expect(document.cookie).toContain('lang=sv');
		expect(invalidateAll).toHaveBeenCalledOnce();
	});

	it('labels its controls in Swedish in the Swedish UI', () => {
		renderTopBar('sv');
		expect(screen.getByRole('button', { name: 'Byt till English' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Växla tema' })).toBeInTheDocument();
		expect(menuButton()).toHaveAccessibleName('Meny');
	});

	it('toggles the theme', async () => {
		const user = userEvent.setup();
		renderTopBar();
		await user.click(screen.getByRole('button', { name: 'Toggle theme' }));
		expect(theme.current).toBe('dark');
	});
});

describe('TopBar mobile drawer', () => {
	it('starts closed and unreachable, and opens from the menu button', async () => {
		const user = userEvent.setup();
		renderTopBar();
		expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
		expect(drawer().inert).toBe(true);

		await user.click(menuButton());
		expect(menuButton()).toHaveAttribute('aria-expanded', 'true');
		expect(drawer().inert).toBe(false);
	});

	it('closes on Escape', async () => {
		const user = userEvent.setup();
		renderTopBar();
		await user.click(menuButton());
		await user.keyboard('{Escape}');
		expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
	});

	it('closes when the overlay is clicked', async () => {
		const user = userEvent.setup();
		const { container } = renderTopBar();
		await user.click(menuButton());
		await user.click(container.querySelector('[aria-hidden="true"].fixed')!);
		expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
	});

	it('closes after an action in the drawer', async () => {
		const user = userEvent.setup();
		renderTopBar();
		await user.click(menuButton());
		await user.click(screen.getByRole('button', { name: /dark mode/i }));
		expect(theme.current).toBe('dark');
		expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
	});
});
