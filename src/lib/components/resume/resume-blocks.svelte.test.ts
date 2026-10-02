import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import type { EntryView } from '$lib/resume';
import ResumeSection from './ResumeSection.svelte';
import SectionChips from './SectionChips.svelte';
import SectionEntry from './SectionEntry.svelte';

const entry: EntryView = {
	id: 1,
	title: 'Spotify',
	subtitle: 'Engineering Director',
	dateRange: '2018 — Present',
	link: null,
	description: [{ kind: 'paragraph', children: [{ kind: 'text', text: 'Leads the team.' }] }]
};

describe('ResumeSection', () => {
	it('shows its label as a heading and renders its content', () => {
		render(ResumeSection, {
			props: {
				label: 'Experience',
				children: createRawSnippet(() => ({ render: () => '<p>content</p>' }))
			}
		});
		expect(screen.getByRole('heading', { level: 2, name: 'Experience' })).toBeInTheDocument();
		expect(screen.getByText('content')).toBeInTheDocument();
	});
});

describe('SectionEntry', () => {
	it('shows title, subtitle, dates and description', () => {
		render(SectionEntry, { props: { entry } });
		expect(screen.getByRole('heading', { level: 3, name: 'Spotify' })).toBeInTheDocument();
		expect(screen.getByText('Engineering Director')).toBeInTheDocument();
		expect(screen.getByText('2018 — Present')).toBeInTheDocument();
		expect(screen.getByText('Leads the team.')).toBeInTheDocument();
		expect(screen.queryByRole('link')).not.toBeInTheDocument();
	});

	it('links the title when the entry has a link', () => {
		render(SectionEntry, { props: { entry: { ...entry, link: 'https://example.com' } } });
		const link = screen.getByRole('link', { name: 'Spotify' });
		expect(link).toHaveAttribute('href', 'https://example.com');
		expect(link).toHaveAttribute('target', '_blank');
		expect(link).toHaveAttribute('rel', 'noopener noreferrer');
	});

	it('leaves out what the entry does not have', () => {
		const { container } = render(SectionEntry, {
			props: { entry: { ...entry, subtitle: null, dateRange: null, description: null } }
		});
		expect(container.querySelectorAll('p')).toHaveLength(0);
	});
});

describe('SectionChips', () => {
	it('renders one chip per item', () => {
		render(SectionChips, { props: { chips: ['Go', 'Rust', 'Svelte'] } });
		for (const chip of ['Go', 'Rust', 'Svelte']) {
			expect(screen.getByText(chip)).toBeInTheDocument();
		}
	});
});
