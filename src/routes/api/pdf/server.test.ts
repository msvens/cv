import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getProfile } from '$lib/server/services/profile';
import { fakeEvent } from '$lib/server/testing/fakeEvent';
import type { ProfileData } from '$lib/types';
import { GET } from './+server';

// Mock our own service modules (not Drizzle): this tests the endpoint's behaviour around them.
vi.mock('$lib/server/services/profile', () => ({ getProfile: vi.fn() }));
vi.mock('$lib/server/services/sections', () => ({
	listPdfSectionsWithItems: vi.fn(async () => [])
}));

const profile: ProfileData = {
	id: 1,
	name: 'Martin Svensson',
	titleEn: 'Engineering Director',
	titleSv: 'Engineering Director',
	email: 'msvens@gmail.com',
	phone: null,
	locationEn: 'Stockholm, Sweden',
	locationSv: 'Stockholm, Sverige',
	github: 'msvens',
	linkedin: null,
	photoUrl: null,
	available: true,
	showGithub: true,
	showLinkedin: true,
	bioEn: 'Bio with åäö — and **bold**.',
	bioSv: 'Bio på svenska.',
	updatedAt: new Date('2026-04-22T07:51:59Z')
};

const get = (url: string) => GET(fakeEvent({ url }) as Parameters<typeof GET>[0]);

beforeEach(() => {
	vi.mocked(getProfile).mockResolvedValue(profile);
});

describe('GET /api/pdf', () => {
	it('renders a real PDF download that is never cached', async () => {
		const res = await get('http://localhost/api/pdf?lang=en');
		expect(res.status).toBe(200);
		expect(res.headers.get('content-type')).toBe('application/pdf');
		expect(res.headers.get('content-disposition')).toBe(
			'attachment; filename="martin-svensson-resume-en.pdf"'
		);
		expect(res.headers.get('cache-control')).toBe('no-store');
		// A real pdfmake render: also proves the font access policy admits Helvetica.
		const bytes = Buffer.from(await res.arrayBuffer());
		expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
	});

	it('uses Swedish for ?lang=sv', async () => {
		const res = await get('http://localhost/api/pdf?lang=sv');
		expect(res.headers.get('content-disposition')).toContain('resume-sv.pdf');
	});

	it.each(['http://localhost/api/pdf?lang=xx', 'http://localhost/api/pdf'])(
		'falls back to English for %s',
		async (url) => {
			const res = await get(url);
			expect(res.headers.get('content-disposition')).toContain('resume-en.pdf');
		}
	);

	it('is a 404 without a profile', async () => {
		vi.mocked(getProfile).mockResolvedValue(null);
		await expect(get('http://localhost/api/pdf')).rejects.toMatchObject({ status: 404 });
	});
});
