import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Page from './+page.svelte';
import type { PageData } from './$types';

const renderPage = (data: Pick<PageData, 'lang' | 'denied'>) => {
	const pageData: PageData = { ...data, profile: null };
	return render(Page, { props: { data: pageData } });
};

describe('admin sign-in page', () => {
	it('offers GitHub sign-in as a form submit (works without JavaScript)', () => {
		renderPage({ lang: 'en', denied: false });
		const button = screen.getByRole('button', { name: 'Sign in with GitHub' });
		expect(button.closest('form')).toHaveAttribute('method', 'POST');
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	it('says access was denied after a refused sign-in, in the page language', () => {
		renderPage({ lang: 'sv', denied: true });
		expect(screen.getByRole('alert')).toHaveTextContent('Åtkomst nekad');
	});
});
