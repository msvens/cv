import type { RequestEvent } from '@sveltejs/kit';

/**
 * A minimal `RequestEvent` for testing hooks and server routes in Node: just a URL, cookies
 * (name → value) and empty locals. Code under test that reaches for anything else fails loudly
 * on `undefined`, which tells the test to grow the fake.
 */
export function fakeEvent({
	url = 'http://localhost/',
	cookies = {}
}: { url?: string; cookies?: Record<string, string> } = {}): RequestEvent {
	const event: Pick<RequestEvent, 'url' | 'cookies' | 'locals'> = {
		url: new URL(url),
		cookies: { get: (name: string) => cookies[name] } as RequestEvent['cookies'],
		locals: {} as App.Locals
	};
	// Casts stay confined to this helper: the rest of RequestEvent is deliberately absent.
	return event as RequestEvent;
}
