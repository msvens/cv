import type { Handle } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { handle } from './hooks.server';

type HandleInput = Parameters<Handle>[0];

/**
 * Runs `handle` against a minimal fake request carrying `cookies` (name → value). `resolve`
 * renders a stub app.html through the hook's `transformPageChunk`, like SvelteKit does.
 */
async function run(cookies: Record<string, string> = {}) {
	const event = { cookies: { get: (name: string) => cookies[name] }, locals: {} };
	const resolve: HandleInput['resolve'] = async (_event, opts) => {
		const html = await opts?.transformPageChunk?.({ html: '<html lang="%lang%">', done: true });
		return new Response(html);
	};
	const response = await handle({ event, resolve } as unknown as HandleInput);
	return { locals: event.locals as App.Locals, html: await response.text() };
}

describe('handle', () => {
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
