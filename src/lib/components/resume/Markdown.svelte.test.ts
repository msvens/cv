import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import type { MdBlock } from '$lib/markdown';
import Markdown from './Markdown.svelte';

const text = (t: string) => ({ kind: 'text' as const, text: t });

describe('Markdown', () => {
	it('renders paragraphs, lists and emphasis with the old classes', () => {
		const blocks: MdBlock[] = [
			{ kind: 'paragraph', children: [text('Intro')] },
			{
				kind: 'list',
				ordered: false,
				items: [[{ kind: 'plain', children: [{ kind: 'strong', children: [text('Bold')] }] }]]
			}
		];
		const { container } = render(Markdown, { props: { blocks } });
		expect(screen.getByText('Intro').tagName).toBe('P');
		expect(container.querySelector('ul')).toHaveClass('list-disc', 'ml-6');
		expect(screen.getByText('Bold')).toHaveClass('font-semibold');
		expect(screen.getByText('Bold').closest('li')).not.toBeNull();
	});

	it('opens links in a new tab', () => {
		render(Markdown, {
			props: {
				blocks: [
					{
						kind: 'paragraph',
						children: [{ kind: 'link', href: 'https://example.com', children: [text('site')] }]
					}
				]
			}
		});
		const link = screen.getByRole('link', { name: 'site' });
		expect(link).toHaveAttribute('href', 'https://example.com');
		expect(link).toHaveAttribute('target', '_blank');
		expect(link).toHaveAttribute('rel', 'noopener noreferrer');
	});

	it('does not add whitespace between inline nodes', () => {
		const { container } = render(Markdown, {
			props: {
				blocks: [
					{
						kind: 'paragraph',
						children: [text('a '), { kind: 'strong', children: [text('b')] }, text('c.')]
					}
				]
			}
		});
		expect(container.querySelector('p')?.textContent).toBe('a bc.');
	});

	it('renders HTML-looking text as text, never as elements', () => {
		const { container } = render(Markdown, {
			props: {
				blocks: [
					{
						kind: 'paragraph',
						children: [text('<script>alert(1)</script><img src=x onerror="alert(1)">')]
					}
				]
			}
		});
		expect(container.querySelector('script')).toBeNull();
		expect(container.querySelector('img')).toBeNull();
		expect(container.querySelector('p')?.textContent).toContain('<script>alert(1)</script>');
	});

	it('renders markdown headings as subheadings below the page sections (h3–h5)', () => {
		const { container } = render(Markdown, {
			props: {
				blocks: [
					{ kind: 'heading', level: 1, children: [text('One')] },
					{ kind: 'heading', level: 2, children: [text('Two')] },
					{ kind: 'heading', level: 3, children: [text('Three')] }
				]
			}
		});
		expect([...container.querySelectorAll('h3, h4, h5')].map((h) => h.tagName)).toEqual([
			'H3',
			'H4',
			'H5'
		]);
		expect(container.querySelector('h1, h2')).toBeNull();
	});
});
