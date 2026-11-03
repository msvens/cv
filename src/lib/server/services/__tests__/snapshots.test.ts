import { beforeEach, describe, expect, it, vi } from 'vitest';
import { application, applicationSnapshot } from '$lib/server/db/schema';
import type { RenderedPdf } from '$lib/server/applicationPdf';
import { db, resetDb } from '$lib/server/testing/testDb';
import { deleteApplication } from '../applications';
import { deleteSnapshot, getSnapshot, listSnapshots, saveSnapshot } from '../snapshots';

vi.mock('$lib/server/db/client', () => import('$lib/server/testing/testDb'));

const pdf = (body: string, kind: RenderedPdf['kind'] = 'letter'): RenderedPdf => ({
	pdf: Buffer.from(`%PDF-${body}`),
	filename: `${body}.pdf`,
	kind,
	language: 'en'
});

let klarna: number;
let spotify: number;
beforeEach(async () => {
	await resetDb();
	[{ id: klarna }, { id: spotify }] = await db
		.insert(application)
		.values([
			{ company: 'Klarna', role: 'Developer' },
			{ company: 'Spotify', role: 'Developer' }
		])
		.returning();
});

describe('snapshots', () => {
	it("lists an application's snapshots newest first, without their bytes", async () => {
		await saveSnapshot(klarna, pdf('first'));
		await saveSnapshot(klarna, pdf('second', 'cv'));
		await saveSnapshot(spotify, pdf('other'));
		const list = await listSnapshots(klarna);
		expect(list.map((s) => s.filename)).toEqual(['second.pdf', 'first.pdf']);
		expect(list[0]).not.toHaveProperty('data');
	});

	it("returns the stored bytes, only through the snapshot's own application", async () => {
		await saveSnapshot(klarna, pdf('mine'));
		const [{ id }] = await listSnapshots(klarna);
		const stored = await getSnapshot(klarna, id);
		expect(Buffer.from(stored?.data ?? []).toString()).toBe('%PDF-mine');
		expect(await getSnapshot(spotify, id)).toBeNull();
	});

	it("deletes only through the snapshot's own application", async () => {
		await saveSnapshot(klarna, pdf('mine'));
		const [{ id }] = await listSnapshots(klarna);
		expect(await deleteSnapshot(spotify, id)).toBe('not-found');
		expect(await deleteSnapshot(klarna, id)).toBe('ok');
		expect(await listSnapshots(klarna)).toEqual([]);
	});

	it('is not saved for a missing application, and goes with a deleted one', async () => {
		expect(await saveSnapshot(999, pdf('nowhere'))).toBe('not-found');
		await saveSnapshot(klarna, pdf('mine'));
		await deleteApplication(klarna);
		expect(await db.select().from(applicationSnapshot)).toEqual([]);
	});
});
