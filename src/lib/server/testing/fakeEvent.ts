import type { RequestEvent } from '@sveltejs/kit';

/**
 * A minimal `RequestEvent` for testing hooks and server routes in Node: just a URL, cookies
 * (name → value) and locals (empty unless given). Code under test that reaches for anything else fails loudly
 * on `undefined`, which tells the test to grow the fake.
 */
export function fakeEvent({
	url = 'http://localhost/',
	cookies = {},
	locals = {}
}: {
	url?: string;
	cookies?: Record<string, string>;
	locals?: Partial<App.Locals>;
} = {}): RequestEvent {
	const event: Pick<RequestEvent, 'url' | 'cookies' | 'locals'> = {
		url: new URL(url),
		cookies: { get: (name: string) => cookies[name] } as RequestEvent['cookies'],
		locals: { ...locals } as App.Locals
	};
	// Casts stay confined to this helper: the rest of RequestEvent is deliberately absent.
	return event as RequestEvent;
}
