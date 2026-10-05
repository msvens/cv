import type { RequestEvent } from '@sveltejs/kit';

/**
 * A minimal `RequestEvent` for testing hooks, server routes and form actions in Node: a URL,
 * cookies (name → value), locals (empty unless given) and, with `form`, a POST request
 * carrying those fields. Code under test that reaches for anything else fails loudly on
 * `undefined`, which tells the test to grow the fake.
 *
 * Generic so it takes the route-specific event type of whatever it is passed to.
 */
export function fakeEvent<E extends RequestEvent = RequestEvent>({
	url = 'http://localhost/',
	cookies = {},
	locals = {},
	form
}: {
	url?: string;
	cookies?: Record<string, string>;
	locals?: Partial<App.Locals>;
	form?: Record<string, string>;
} = {}): E {
	const body = new FormData();
	for (const [name, value] of Object.entries(form ?? {})) body.set(name, value);
	const event: Pick<RequestEvent, 'url' | 'cookies' | 'locals' | 'request'> = {
		url: new URL(url),
		cookies: { get: (name: string) => cookies[name] } as RequestEvent['cookies'],
		locals: { ...locals } as App.Locals,
		request: form ? new Request(url, { method: 'POST', body }) : new Request(url)
	};
	// Casts stay confined to this helper: the rest of RequestEvent is deliberately absent.
	return event as E;
}
