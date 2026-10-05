import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { MAX_UPLOAD_BYTES, processPhoto } from '../photo';

/** A test image made by sharp itself: `width`×`height`, top half red, bottom half blue. */
async function image(
	width: number,
	height: number,
	format: 'jpeg' | 'png',
	orientation?: number
): Promise<Uint8Array> {
	const half = Math.floor(height / 2);
	const red = await sharp({
		create: { width, height: half, channels: 3, background: '#ff0000' }
	})
		.png()
		.toBuffer();
	let img = sharp({
		create: { width, height, channels: 3, background: '#0000ff' }
	}).composite([{ input: red, top: 0, left: 0 }]);
	if (orientation) img = img.withMetadata({ orientation });
	return new Uint8Array(await (format === 'jpeg' ? img.jpeg() : img.png()).toBuffer());
}

describe('processPhoto', () => {
	it('crops any image to a 256×256 JPEG', async () => {
		const result = await processPhoto(await image(1200, 600, 'jpeg'));
		if (typeof result === 'string') throw new Error(result);
		const meta = await sharp(result.data).metadata();
		expect([meta.format, meta.width, meta.height]).toEqual(['jpeg', 256, 256]);
		expect(result.contentType).toBe('image/jpeg');
	});

	it('reads PNG too', async () => {
		const result = await processPhoto(await image(300, 300, 'png'));
		expect(typeof result).toBe('object');
	});

	// Phones store rotation as EXIF orientation; without .rotate() the photo comes out sideways.
	it('applies the camera orientation, then drops all metadata', async () => {
		// Orientation 6 = rotate 90° clockwise to display: the red top half ends up on the right.
		const result = await processPhoto(await image(400, 200, 'jpeg', 6));
		if (typeof result === 'string') throw new Error(result);
		const meta = await sharp(result.data).metadata();
		expect(meta.exif).toBeUndefined();
		expect(meta.orientation).toBeUndefined();
		const { data, info } = await sharp(result.data).raw().toBuffer({ resolveWithObject: true });
		const pixel = (x: number, y: number) => {
			const i = (y * info.width + x) * info.channels;
			return [data[i], data[i + 1], data[i + 2]];
		};
		const [r, , b] = pixel(240, 128); // right edge, middle
		expect(r).toBeGreaterThan(200);
		expect(b).toBeLessThan(60);
	});

	it('refuses something that is not an image', async () => {
		expect(await processPhoto(new TextEncoder().encode('not an image at all'))).toBe(
			'not-an-image'
		);
	});

	it('refuses files over 10 MB without decoding them', async () => {
		expect(await processPhoto(new Uint8Array(MAX_UPLOAD_BYTES + 1))).toBe('too-large');
	});
});
