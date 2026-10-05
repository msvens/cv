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
