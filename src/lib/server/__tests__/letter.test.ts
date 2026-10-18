import { describe, expect, it } from 'vitest';
import { letterParts } from '$lib/server/letter';
import type { ApplicationContact, ApplicationData, Letter, ProfileData } from '$lib/types';

const profile: ProfileData = {
	id: 1,
	name: 'Martin Svensson',
	titleEn: 'Engineering Director',
	titleSv: 'Teknikchef',
	email: 'msvens@gmail.com',
	phone: '+46 70 123',
	locationEn: 'Stockholm, Sweden',
	locationSv: 'Stockholm, Sverige',
	github: 'msvens',
	linkedin: null,
	photoUrl: null,
	available: true,
	showGithub: true,
	showLinkedin: true,
	bioEn: '',
	bioSv: '',
	updatedAt: new Date()
};
const application = { id: 7, company: 'Spotify' } as ApplicationData;
const anna: ApplicationContact = {
	id: 3,
	applicationId: 7,
	name: 'Anna Berg',
	role: 'Recruiter',
	email: null,
	phone: null,
	note: null,
	createdAt: new Date()
};
const letter = (over: Partial<Letter> = {}): Letter => ({
	id: 1,
	applicationId: 7,
	language: 'en',
	body: 'Hello **there**.',
	includeContact: true,
	includeRecipient: true,
	recipientContactId: 3,
	createdAt: new Date(),
	updatedAt: new Date(),
	...over
});
const parts = (l: Letter, contacts = [anna]) => letterParts(l, application, contacts, profile);

describe('letterParts', () => {
	it('is all English for an English letter', () => {
		expect(parts(letter())).toMatchObject({
			lang: 'en',
			sender: {
				name: 'Martin Svensson',
				title: 'Engineering Director',
				location: 'Stockholm, Sweden',
				email: 'msvens@gmail.com',
				phone: '+46 70 123'
			},
			recipient: { company: 'Spotify', name: 'Anna Berg', role: 'Recruiter' }
		});
	});

	it('is all Swedish for a Swedish letter: title and location', () => {
		expect(parts(letter({ language: 'sv' }))).toMatchObject({
			lang: 'sv',
			sender: { title: 'Teknikchef', location: 'Stockholm, Sverige' }
		});
	});

	it('leaves out the sender and the recipient when they are not ticked', () => {
		const p = parts(letter({ includeContact: false, includeRecipient: false }));
		expect(p.sender).toBeNull();
		expect(p.recipient).toBeNull();
	});

	it('addresses the company alone without a contact, or with one of another application', () => {
		const companyOnly = { company: 'Spotify', name: null, role: null };
		expect(parts(letter({ recipientContactId: null })).recipient).toEqual(companyOnly);
		expect(parts(letter(), [{ ...anna, applicationId: 8 }]).recipient).toEqual(companyOnly);
	});

	it('parses the body as markdown', () => {
		expect(parts(letter()).body).toEqual([
			{
				kind: 'paragraph',
				children: [
					{ kind: 'text', text: 'Hello ' },
					{ kind: 'strong', children: [{ kind: 'text', text: 'there' }] },
					{ kind: 'text', text: '.' }
				]
			}
		]);
	});
});
