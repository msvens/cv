import sharp from 'sharp';

/** The avatar is shown at 72–96 px; 256 px stays sharp on high-density screens. */
export const PHOTO_SIZE = 256;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type ProcessedPhoto = { data: Uint8Array; contentType: 'image/jpeg' };
export type PhotoResult = ProcessedPhoto | 'too-large' | 'not-an-image';

/**
 * Turn any uploaded image into the profile photo: apply the camera's orientation, crop to a
 * centred square, scale to PHOTO_SIZE and encode as JPEG. sharp writes no metadata unless
 * asked, so EXIF (GPS, camera serial, …) is dropped.
 */
export async function processPhoto(input: Uint8Array): Promise<PhotoResult> {
	if (input.byteLength > MAX_UPLOAD_BYTES) return 'too-large';
	try {
		const data = await sharp(input)
			.rotate() // honour EXIF orientation before it is stripped
			.resize(PHOTO_SIZE, PHOTO_SIZE, { fit: 'cover' })
			.jpeg({ quality: 85, mozjpeg: true })
			.toBuffer();
		return { data: new Uint8Array(data), contentType: 'image/jpeg' };
	} catch {
		// sharp could not decode it: not an image (or not one it supports).
		return 'not-an-image';
	}
}
