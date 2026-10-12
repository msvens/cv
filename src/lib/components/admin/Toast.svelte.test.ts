import { render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from '$app/state';
import Toast from './Toast.svelte';

// A reactive stand-in for SvelteKit's page, so a test can "submit" again.
// form is raw, like SvelteKit's: action results are plain objects, not proxies.
vi.mock('$app/state', () => {
	class Page {
		form: unknown = $state.raw(null);
	}
	return { page: new Page() };
});

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
	vi.useRealTimers();
	page.form = null;
});

describe('Toast', () => {
	it('announces a success message and hides it after 4 seconds', () => {
		page.form = { message: 'Settings saved.' };
		render(Toast);
		expect(screen.getByRole('status')).toHaveTextContent('Settings saved.');

		vi.advanceTimersByTime(3999);
		flushSync();
		expect(screen.getByRole('status')).toHaveTextContent('Settings saved.');
		vi.advanceTimersByTime(1);
		flushSync();
		expect(screen.getByRole('status')).toBeEmptyDOMElement();
	});

	it('shows the same message again for a new submit', () => {
		page.form = { message: 'Item saved.' };
		render(Toast);
		vi.advanceTimersByTime(4000);
		flushSync();
		expect(screen.getByRole('status')).toBeEmptyDOMElement();

		page.form = { message: 'Item saved.' };
		flushSync();
		expect(screen.getByRole('status')).toHaveTextContent('Item saved.');
	});

	it('closes on the close button, before the timer', () => {
		page.form = { message: 'Profile saved.' };
		render(Toast);
		screen.getByRole('button', { name: 'Close' }).click();
		flushSync();
		expect(screen.getByRole('status')).toBeEmptyDOMElement();
	});

	it.each([
		['no result', null],
		['field errors', { values: {}, errors: { name: ['Required'] } }],
		['an inline error', { error: 'That section no longer exists.' }]
	])('shows nothing for %s', (_, form) => {
		page.form = form;
		render(Toast);
		expect(screen.getByRole('status')).toBeEmptyDOMElement();
	});
});
