import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import DeleteButton from './DeleteButton.svelte';
import ItemFields from './ItemFields.svelte';
import ReorderButtons from './ReorderButtons.svelte';

// Progressive enhancement is SvelteKit's runtime; these tests check the plain forms underneath.
vi.mock('$app/forms', () => ({ enhance: () => ({ destroy() {} }) }));

describe('DeleteButton', () => {
	const props = { action: '?/delete', id: 7, confirmText: 'Delete “Experience” and its 8 items?' };

	it('submits nothing until confirmed, and says what goes with it (#21)', async () => {
		const user = userEvent.setup();
		const { container } = render(DeleteButton, { props });
		expect(container.querySelector('form')).toBeNull();

		await user.click(screen.getByRole('button', { name: 'Delete' }));
		expect(screen.getByText('Delete “Experience” and its 8 items?')).toBeInTheDocument();
		const form = container.querySelector('form')!;
		expect(form).toHaveAttribute('action', '?/delete');
		expect(form.querySelector('input[name="id"]')).toHaveValue('7');
		expect(screen.getByRole('button', { name: 'Confirm' }).closest('form')).toBe(form);
	});

	it('goes back on Cancel', async () => {
		const user = userEvent.setup();
		const { container } = render(DeleteButton, { props });
		await user.click(screen.getByRole('button', { name: 'Delete' }));
		await user.click(screen.getByRole('button', { name: 'Cancel' }));
		expect(container.querySelector('form')).toBeNull();
		expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
	});
});

describe('ReorderButtons', () => {
	it('posts the direction for the row', () => {
		const { container } = render(ReorderButtons, {
			props: { action: '?/move', id: 3, isFirst: false, isLast: false }
		});
		expect(container.querySelector('form')).toHaveAttribute('action', '?/move');
		expect(container.querySelector('input[name="id"]')).toHaveValue('3');
		expect(screen.getByRole('button', { name: 'Move up' })).toHaveAttribute('value', 'up');
		expect(screen.getByRole('button', { name: 'Move down' })).toHaveAttribute('value', 'down');
	});

	it('disables the moves that would go past the ends', () => {
		render(ReorderButtons, { props: { action: '?/move', id: 3, isFirst: true, isLast: true } });
		expect(screen.getByRole('button', { name: 'Move up' })).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Move down' })).toBeDisabled();
	});
});

describe('ItemFields', () => {
	it('shows only the titles for a chip section', () => {
		const { container } = render(ItemFields, { props: { chips: true } });
		const names = [...container.querySelectorAll('[name]')].map((el) => el.getAttribute('name'));
		expect(names).toEqual(['titleEn', 'titleSv']);
	});

	it('shows every field for an entry, filled from the item', () => {
		const { container } = render(ItemFields, {
			props: { chips: false, values: { titleEn: 'Spotify', startDate: '2018-01-01', link: null } }
		});
		const names = [...container.querySelectorAll('[name]')].map((el) => el.getAttribute('name'));
		expect(names).toEqual([
			'titleEn',
			'titleSv',
			'subtitleEn',
			'subtitleSv',
			'startDate',
			'endDate',
			'link',
			'descriptionEn',
			'descriptionSv'
		]);
		expect(container.querySelector('[name="titleEn"]')).toHaveValue('Spotify');
		expect(container.querySelector('[name="startDate"]')).toHaveValue('2018-01-01');
	});

	it('keeps element ids unique per form', () => {
		const { container } = render(ItemFields, { props: { chips: false, idPrefix: 'item-4' } });
		expect(container.querySelector('#item-4-titleEn')).not.toBeNull();
		expect(container.querySelector('#titleEn')).toBeNull();
	});
});
