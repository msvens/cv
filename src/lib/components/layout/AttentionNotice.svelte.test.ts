import { render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AttentionNotice from './AttentionNotice.svelte';

const current = vi.hoisted(() => ({ path: '/' }));
vi.mock('$app/state', () => ({
	page: {
		get url() {
			return new URL(`http://localhost${current.path}`);
		}
	}
}));

afterEach(() => {
	current.path = '/';
});

const many = (count: number) => ({ count, only: null });
const one = { count: 1, only: { id: 42, company: 'Acme', role: 'Staff Engineer' } };

describe('AttentionNotice', () => {
	it('names a single application and links straight to it', () => {
		render(AttentionNotice, { attention: one, lang: 'en' });
		const link = screen.getByRole('link', { name: /Acme · Staff Engineer needs attention/ });
		expect(link).toHaveAttribute('href', '/admin/applications/42');
	});

	it('counts several and links to the applications', () => {
		render(AttentionNotice, { attention: many(3), lang: 'en' });
		const link = screen.getByRole('link', { name: /3 applications need attention/ });
		expect(link).toHaveAttribute('href', '/admin/applications');
	});

	it('speaks Swedish', () => {
		const { unmount } = render(AttentionNotice, { attention: many(3), lang: 'sv' });
		expect(screen.getByRole('link')).toHaveTextContent('3 ansökningar behöver åtgärdas');
		unmount();
		render(AttentionNotice, { attention: one, lang: 'sv' });
		expect(screen.getByRole('link')).toHaveTextContent('Acme · Staff Engineer behöver åtgärdas');
	});

	it.each([
		['nothing needs attention', many(0)],
		['the visitor is not the admin', null]
	])('shows nothing when %s', (_, attention) => {
		render(AttentionNotice, { attention, lang: 'en' });
		expect(screen.queryByRole('link')).toBeNull();
	});

	it('stays out of the admin, where the nav shows the count', () => {
		current.path = '/admin/settings';
		render(AttentionNotice, { attention: one, lang: 'en' });
		expect(screen.queryByRole('link')).toBeNull();
	});
});
