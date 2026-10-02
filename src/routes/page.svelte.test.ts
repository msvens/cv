import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import type { ResumeView } from '$lib/resume';
import Page from './+page.svelte';
import type { PageData } from './$types';

const resume: ResumeView = {
	header: {
		name: 'Martin Svensson',
		title: 'Engineering Director',
		email: 'msvens@gmail.com',
		phone: null,
		location: 'Stockholm, Sweden',
		photoUrl: null,
		available: false,
		bio: []
	},
	sections: [
		{
			id: 1,
			label: 'Experience',
			kind: 'entries',
			entries: [
				{
					id: 1,
					title: 'Spotify',
					subtitle: null,
					dateRange: null,
					link: null,
					description: null
				}
			]
		},
		{ id: 2, label: 'Skills', kind: 'chips', chips: ['Go', 'Rust'] }
	]
};

function renderPage(data: Pick<PageData, 'lang' | 'resume'>) {
	// The page only reads `lang` and `resume`; the layout's profile isn't used here.
	const pageData: PageData = { ...data, profile: null };
	return render(Page, { props: { data: pageData } });
}

describe('resume page', () => {
	it('renders the header and every section in order', () => {
		renderPage({ lang: 'en', resume });
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Martin Svensson');
		expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent?.trim())).toEqual([
			'Experience',
			'Skills'
		]);
		expect(screen.getByRole('heading', { level: 3, name: 'Spotify' })).toBeInTheDocument();
		expect(screen.getByText('Rust')).toBeInTheDocument();
	});

	it('shows the empty state without a profile, in the page language', () => {
		renderPage({ lang: 'sv', resume: null });
		expect(screen.getByText(/Ingen profil hittades/)).toBeInTheDocument();
	});
});
