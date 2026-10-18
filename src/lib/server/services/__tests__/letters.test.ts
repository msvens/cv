import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { application, applicationContact, letter } from '$lib/server/db/schema';
import { db, resetDb } from '$lib/server/testing/testDb';
import type { LetterInput } from '$lib/validation/schemas';
import { deleteApplication, deleteContact } from '../applications';
import { copyLetter, deleteLetter, getLetter, listLetterSources, saveLetter } from '../letters';

vi.mock('$lib/server/db/client', () => import('$lib/server/testing/testDb'));

const draft: LetterInput = {
	language: 'sv',
	body: 'Hej!',
	includeContact: true,
	includeRecipient: true,
	recipientContactId: null
};

let klarna: number;
let spotify: number;
let anna: number;
beforeEach(async () => {
	await resetDb();
	[{ id: klarna }, { id: spotify }] = await db
		.insert(application)
		.values([
			{ company: 'Klarna', role: 'Developer', updatedAt: new Date('2026-01-01') },
			{ company: 'Spotify', role: 'Lead', updatedAt: new Date('2026-01-01') }
		])
		.returning();
	[{ id: anna }] = await db
		.insert(applicationContact)
		.values({ applicationId: klarna, name: 'Anna' })
		.returning();
});

const updatedAt = async (id: number) =>
	(await db.select().from(application).where(eq(application.id, id)))[0].updatedAt;

describe('letters', () => {
	it('creates the letter on the first save and updates it after', async () => {
		expect(await getLetter(klarna)).toBeNull();
		expect(await saveLetter(klarna, draft)).toBe('ok');
		expect(
			await saveLetter(klarna, { ...draft, body: 'Hej igen!', recipientContactId: anna })
		).toBe('ok');
		expect(await db.select().from(letter)).toMatchObject([
			{ applicationId: klarna, language: 'sv', body: 'Hej igen!', recipientContactId: anna }
		]);
	});

	it('marks the application as worked on', async () => {
		await saveLetter(klarna, draft);
		expect(await updatedAt(klarna)).not.toEqual(new Date('2026-01-01'));
		expect(await updatedAt(spotify)).toEqual(new Date('2026-01-01'));
	});

	it("refuses another application's contact as the recipient", async () => {
		expect(await saveLetter(spotify, { ...draft, recipientContactId: anna })).toBe('bad-contact');
		expect(await getLetter(spotify)).toBeNull();
	});

	it('is not-found for a missing application', async () => {
		expect(await saveLetter(9999, draft)).toBe('not-found');
		expect(await deleteLetter(klarna)).toBe('not-found');
	});

	it('deletes the letter', async () => {
		await saveLetter(klarna, draft);
		expect(await deleteLetter(klarna)).toBe('ok');
		expect(await getLetter(klarna)).toBeNull();
	});

	it('keeps the letter, addressed to the company, when its contact is deleted', async () => {
		await saveLetter(klarna, { ...draft, recipientContactId: anna });
		await deleteContact(klarna, anna);
		expect(await getLetter(klarna)).toMatchObject({ body: 'Hej!', recipientContactId: null });
	});

	it('goes with its application', async () => {
		await saveLetter(klarna, draft);
		await deleteApplication(klarna);
		expect(await db.select().from(letter)).toEqual([]);
	});

	describe('starting from an earlier letter', () => {
		beforeEach(async () => {
			await saveLetter(klarna, { ...draft, recipientContactId: anna });
		});

		it("offers the other applications' letters", async () => {
			expect(await listLetterSources(spotify)).toMatchObject([
				{ applicationId: klarna, company: 'Klarna', role: 'Developer', language: 'sv' }
			]);
			expect(await listLetterSources(klarna)).toEqual([]);
		});

		it('copies the text and language only', async () => {
			expect(await copyLetter(spotify, klarna)).toBe('ok');
			expect(await getLetter(spotify)).toMatchObject({
				language: 'sv',
				body: 'Hej!',
				includeContact: false,
				includeRecipient: false,
				recipientContactId: null
			});
		});

		it('never replaces an existing letter', async () => {
			await saveLetter(spotify, { ...draft, body: 'Mine' });
			expect(await copyLetter(spotify, klarna)).toBe('exists');
			expect(await getLetter(spotify)).toMatchObject({ body: 'Mine' });
		});

		it('is not-found without a source, or onto a missing application', async () => {
			expect(await copyLetter(klarna, spotify)).toBe('not-found');
			expect(await copyLetter(klarna, klarna)).toBe('not-found');
			expect(await copyLetter(9999, klarna)).toBe('not-found');
		});
	});
});
