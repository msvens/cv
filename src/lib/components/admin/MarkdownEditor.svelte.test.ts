import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('MarkdownEditor layout', () => {
	beforeEach(() => localStorage.clear());
	afterEach(() => vi.restoreAllMocks());

	const previewToggle = () => screen.getByRole('button', { name: 'Preview' });
	const preview = () => screen.queryByRole('region', { name: 'Preview' });

	it('starts as this browser last left it, and stores each change', async () => {
		localStorage.setItem('md-preview:a', 'off');
		const user = userEvent.setup();
		render(MarkdownEditor, { props: { name: 'a', value: 'x' } });
		await vi.waitFor(() => expect(preview()).toBeNull());
		expect(previewToggle()).toHaveAttribute('aria-pressed', 'false');
		await user.click(previewToggle());
		expect(preview()).not.toBeNull();
		expect(previewToggle()).toHaveAttribute('aria-pressed', 'true');
		expect(localStorage.getItem('md-preview:a')).toBe('on');
		await user.click(previewToggle());
		expect(localStorage.getItem('md-preview:a')).toBe('off');
	});

	it('still toggles when the browser refuses storage', async () => {
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new Error('denied');
		});
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new Error('denied');
		});
		const user = userEvent.setup();
		render(MarkdownEditor, { props: { name: 'a', value: 'x' } });
		const shown = preview() !== null;
		await user.click(previewToggle());
		expect(preview() !== null).toBe(!shown);
	});

	it('toggles each editor on its own', async () => {
		const user = userEvent.setup();
		render(MarkdownEditor, { props: { name: 'en', value: 'x' } });
		render(MarkdownEditor, { props: { name: 'sv', value: 'y' } });
		await user.click(screen.getAllByRole('button', { name: 'Preview' })[0]);
		expect(screen.getAllByRole('region', { name: 'Preview' })).toHaveLength(1);
		expect(localStorage.getItem('md-preview:en')).toBe('off');
		expect(localStorage.getItem('md-preview:sv')).toBeNull();
	});

	it('fills the window until Esc, holding the page still meanwhile', async () => {
		const user = userEvent.setup();
		render(MarkdownEditor, { props: { name: 'a', value: 'x' } });
		const expand = screen.getByRole('button', { name: 'Expand' });
		await user.click(expand);
		expect(expand).toHaveAttribute('aria-pressed', 'true');
		expect(document.querySelector('.fixed.inset-0')).not.toBeNull();
		expect(document.body.style.overflow).toBe('hidden');
		await user.keyboard('{Escape}');
		expect(expand).toHaveAttribute('aria-pressed', 'false');
		expect(document.querySelector('.fixed.inset-0')).toBeNull();
		expect(document.body.style.overflow).toBe('');
	});
});

describe('MarkdownEditor paste', () => {
	/** A paste event carrying `data` (type → content), as a browser builds it. */
	const pasteInto = async (textarea: HTMLTextAreaElement, data: Record<string, string>) => {
		const event = new Event('paste', { bubbles: true, cancelable: true });
		Object.defineProperty(event, 'clipboardData', {
			value: { getData: (type: string) => data[type] ?? '' }
		});
		await fireEvent(textarea, event);
		return event;
	};

	it('pastes formatted text as markdown in place of the selection', async () => {
		const { textarea, submitted } = renderEditor('Dear X,');
		textarea.setSelectionRange(5, 6);
		const event = await pasteInto(textarea, {
			'text/html': '<p>Anna and <b>team</b></p>',
			'text/plain': 'Anna and team'
		});
		expect(event.defaultPrevented).toBe(true);
		expect(textarea).toHaveValue('Dear Anna and **team**,');
		expect(submitted().get('bioEn')).toBe('Dear Anna and **team**,');
	});

	it('leaves plain text and code-editor pastes to the browser', async () => {
		const { textarea } = renderEditor('');
		expect((await pasteInto(textarea, { 'text/plain': '**md**' })).defaultPrevented).toBe(false);
		const vscode = {
			'text/html': '<div style="font-family: Menlo, monospace; white-space: pre;">**md**</div>'
		};
		expect((await pasteInto(textarea, vscode)).defaultPrevented).toBe(false);
	});
});
