import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PhotoForms from './PhotoForms.svelte';

vi.mock('$app/forms', () => ({ enhance: () => ({ destroy() {} }) }));

afterEach(() => vi.restoreAllMocks());

const file = (bytes: number, name = 'me.jpg') =>
	new File([new Uint8Array(bytes)], name, { type: 'image/jpeg' });

describe('PhotoForms', () => {
	it('offers a clear "Choose image…" button for a multipart upload of images', () => {
		render(PhotoForms, { props: { photoUrl: null } });
		const input = screen.getByLabelText('Choose image…');
		expect(input).toHaveAttribute('type', 'file');
		expect(input).toHaveAttribute('accept', 'image/*');
		expect(input.closest('form')).toHaveAttribute('enctype', 'multipart/form-data');
		expect(input.closest('form')).toHaveAttribute('action', '?/uploadPhoto');
		expect(screen.getByText(/replaces the current photo/)).toBeInTheDocument();
		expect(screen.getByText('No photo')).toBeInTheDocument();
	});

	// Choosing a file (OK in the dialog) is the decision: no separate Upload step.
	it('uploads as soon as a file is chosen', async () => {
		const submit = vi
			.spyOn(HTMLFormElement.prototype, 'requestSubmit')
			.mockImplementation(() => {});
		const user = userEvent.setup();
		render(PhotoForms, { props: { photoUrl: null } });
		await user.upload(screen.getByLabelText('Choose image…'), file(1000));
		expect(submit).toHaveBeenCalledOnce();
		expect(screen.getByText('Uploading me.jpg…')).toBeInTheDocument();
	});

	it('stops a file over 10 MB before sending anything', async () => {
		const submit = vi
			.spyOn(HTMLFormElement.prototype, 'requestSubmit')
			.mockImplementation(() => {});
		const user = userEvent.setup();
		render(PhotoForms, { props: { photoUrl: null } });
		await user.upload(
			screen.getByLabelText('Choose image…'),
			file(10 * 1024 * 1024 + 1, 'huge.jpg')
		);
		expect(submit).not.toHaveBeenCalled();
		expect(screen.getByRole('alert')).toHaveTextContent('huge.jpg is larger than 10 MB');
	});

	it('shows a linked image URL in its field, and the photo without a referrer', () => {
		const url = 'https://www.mellowtech.org/api/thumbs/x.jpg';
		render(PhotoForms, { props: { photoUrl: url } });
		expect(screen.getByLabelText('…or use an image URL')).toHaveValue(url);
		expect(screen.getByRole('img', { name: 'Current profile' })).toHaveAttribute(
			'referrerpolicy',
			'no-referrer'
		);
		expect(screen.getByRole('button', { name: 'Remove photo' })).toBeInTheDocument();
	});

	it('leaves the URL field empty for an uploaded photo', () => {
		render(PhotoForms, { props: { photoUrl: '/photo?v=abc' } });
		expect(screen.getByLabelText('…or use an image URL')).toHaveValue('');
	});
});
