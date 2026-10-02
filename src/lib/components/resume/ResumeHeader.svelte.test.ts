import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import type { HeaderView } from '$lib/resume';
import ResumeHeader from './ResumeHeader.svelte';

const header: HeaderView = {
	name: 'Martin Svensson',
	title: 'Engineering Director',
	email: 'msvens@gmail.com',
	phone: null,
	location: 'Stockholm, Sweden',
	photoUrl: '/profile.jpg',
	available: true,
	bio: [{ kind: 'paragraph', children: [{ kind: 'text', text: 'Builds teams.' }] }]
};

describe('ResumeHeader', () => {
	it('shows name, title, location and bio', () => {
		render(ResumeHeader, { props: { header, lang: 'en' } });
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
			'Martin Svensson, Engineering Director'
		);
		expect(screen.getByText('Stockholm, Sweden')).toBeInTheDocument();
		expect(screen.getByText('Builds teams.')).toBeInTheDocument();
	});

	it('links the email address', () => {
		render(ResumeHeader, { props: { header, lang: 'en' } });
		expect(screen.getByRole('link', { name: /msvens@gmail.com/ })).toHaveAttribute(
			'href',
			'mailto:msvens@gmail.com'
		);
	});

	it('shows the photo at avatar size, named after the person', () => {
		render(ResumeHeader, { props: { header, lang: 'en' } });
		const photo = screen.getByRole('img', { name: 'Martin Svensson' });
		expect(photo).toHaveAttribute('src', '/profile.jpg');
		expect(photo).toHaveAttribute('width', '72');
	});

	it('shows no photo without a photo URL', () => {
		render(ResumeHeader, { props: { header: { ...header, photoUrl: null }, lang: 'en' } });
		expect(screen.queryByRole('img', { name: 'Martin Svensson' })).not.toBeInTheDocument();
	});

	it('shows the phone number only when there is one', () => {
		const { unmount } = render(ResumeHeader, { props: { header, lang: 'en' } });
		expect(screen.queryByText('+46 70 000 00 00')).not.toBeInTheDocument();
		unmount();
		render(ResumeHeader, {
			props: { header: { ...header, phone: '+46 70 000 00 00' }, lang: 'en' }
		});
		expect(screen.getByText('+46 70 000 00 00')).toBeInTheDocument();
	});

	// The old header hardcoded English "Available" in both languages.
	it('translates the availability badge', () => {
		render(ResumeHeader, { props: { header, lang: 'sv' } });
		expect(screen.getByText('Tillgänglig')).toBeInTheDocument();
	});

	it('hides the availability badge when not available', () => {
		render(ResumeHeader, { props: { header: { ...header, available: false }, lang: 'en' } });
		expect(screen.queryByText('Available')).not.toBeInTheDocument();
	});
});
