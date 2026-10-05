import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import MarkdownEditor from './MarkdownEditor.svelte';

/** Rendered inside a <form>, so we can check what the form would submit. */
const renderEditor = (value: string) => {
	const form = document.body.appendChild(document.createElement('form'));
	render(MarkdownEditor, { target: form, props: { name: 'bioEn', value, label: 'EN' } });
	return { textarea: form.querySelector('textarea')!, submitted: () => new FormData(form) };
};

describe('MarkdownEditor', () => {
	it('starts with the given value, submitted under its name', () => {
		const { textarea } = renderEditor('Hello');
		expect(textarea).toHaveValue('Hello');
		expect(textarea).toHaveAttribute('name', 'bioEn');
		expect(screen.getByLabelText('EN')).toBe(textarea);
	});

	it('bolds the selection from the toolbar', async () => {
		const user = userEvent.setup();
		const { textarea } = renderEditor('say hello');
		textarea.setSelectionRange(4, 9);
		await user.click(screen.getByRole('button', { name: 'B' }));
		expect(textarea).toHaveValue('say **hello**');
	});

	it('turns the current line into a heading or a list item', async () => {
		const user = userEvent.setup();
		const { textarea } = renderEditor('Title\nitem');
		textarea.setSelectionRange(2, 2);
		await user.click(screen.getByRole('button', { name: 'H2' }));
		expect(textarea).toHaveValue('## Title\nitem');
		textarea.setSelectionRange(11, 11); // on "item"
		await user.click(screen.getByRole('button', { name: '1. List' }));
		expect(textarea).toHaveValue('## Title\n1. item');
	});

	it('previews live as the text changes, and submits the text', async () => {
		const user = userEvent.setup();
		const { textarea, submitted } = renderEditor('');
		const preview = screen.getByRole('region', { name: 'Preview' });
		await user.type(textarea, '# Hi{enter}{enter}- **one**');
		// # → h3: the page's h1/h2 are the name and the section titles.
		expect(preview.querySelector('h3')).toHaveTextContent('Hi');
		expect(preview.querySelector('ul li strong')).toHaveTextContent('one');
		expect(submitted().get('bioEn')).toBe('# Hi\n\n- **one**');
	});
});
