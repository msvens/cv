import type { Handle } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { fakeEvent } from '$lib/server/testing/fakeEvent';
import { langHandle } from '../lang';

/**
 * Runs `langHandle` against a fake request carrying `cookies`. `resolve` renders a stub app.html
 * through the hook's `transformPageChunk`, like SvelteKit does.
 */
async function run(cookies: Record<string, string> = {}) {
	const event = fakeEvent({ cookies });
	const resolve: Parameters<Handle>[0]['resolve'] = async (_event, opts) => {
		const html = await opts?.transformPageChunk?.({ html: '<html lang="%lang%">', done: true });
		return new Response(html);
	};
	const response = await langHandle({ event, resolve });
	return { locals: event.locals, html: await response.text() };
}

describe('langHandle', () => {
	it('uses the language from the lang cookie', async () => {
		const { locals, html } = await run({ lang: 'sv' });
		expect(locals.lang).toBe('sv');
		expect(html).toBe('<html lang="sv">');
	});

	it.each([
		['no cookie', {}],
		['an invalid cookie', { lang: 'xx' }]
	])('defaults to en with %s', async (_, cookies) => {
		const { locals, html } = await run(cookies);
		expect(locals.lang).toBe('en');
		expect(html).toBe('<html lang="en">');
	});
});
