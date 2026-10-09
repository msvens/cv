import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AdminNav from './AdminNav.svelte';

vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost/admin/profile') } }));

describe('AdminNav', () => {
	it('marks the current page', () => {
		render(AdminNav);
		for (const link of screen.getAllByRole('link', { name: 'Profile' })) {
			expect(link).toHaveAttribute('href', '/admin/profile');
			expect(link).toHaveAttribute('aria-current', 'page');
		}
	});

	it('lists Applications first', () => {
		render(AdminNav);
		const [first] = screen.getAllByRole('link');
		expect(first).toHaveAccessibleName('Applications');
		expect(first).toHaveAttribute('href', '/admin/applications');
		expect(first).not.toHaveAttribute('aria-current');
	});

	it('shows how many applications need attention, and nothing when none do', () => {
		const { unmount } = render(AdminNav, { attentionCount: 2 });
		expect(screen.getAllByLabelText('2 need attention').length).toBeGreaterThan(0);
		unmount();
		render(AdminNav, { attentionCount: 0 });
		expect(screen.queryByLabelText(/need attention/)).toBeNull();
	});

	it('links to the settings', () => {
		render(AdminNav);
		expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute(
			'href',
			'/admin/settings'
		);
	});

	it('signs out with a POST to /admin/signout', () => {
		render(AdminNav);
		const form = screen.getAllByRole('button', { name: 'Sign out' })[0].closest('form');
		expect(form).toHaveAttribute('method', 'POST');
		expect(form).toHaveAttribute('action', '/admin/signout');
	});

	it('opens the mobile menu, labelled with the current page, and closes it on Escape', async () => {
		const user = userEvent.setup();
		render(AdminNav);
		const toggle = screen.getByRole('button', { name: 'Profile' });
		expect(toggle).toHaveAttribute('aria-expanded', 'false');
		await user.click(toggle);
		expect(toggle).toHaveAttribute('aria-expanded', 'true');
		await user.keyboard('{Escape}');
		expect(toggle).toHaveAttribute('aria-expanded', 'false');
	});
});
