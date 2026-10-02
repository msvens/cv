/**
 * Light/dark theme: Tailwind's class-based dark mode, persisted in localStorage.
 *
 * A module singleton (global client state), so the pre-paint script in `app.html` and the
 * app read the same source. Behaviour is the Next app's: an explicit choice in localStorage
 * wins, otherwise light. The OS setting is not followed — that would be a product change,
 * not a migration side effect.
 *
 * State + actions only (no `$effect`), so it can be unit-tested by importing it directly.
 * The root layout owns the side effect of applying the class to `<html>`.
 */
export type Theme = 'light' | 'dark';

const KEY = 'theme';
const DEFAULT: Theme = 'light';

let current = $state<Theme>(DEFAULT);

// localStorage can throw (storage disabled, sandboxed iframes); the theme then just isn't
// remembered.
function readStored(): string | null {
	try {
		return localStorage.getItem(KEY);
	} catch {
		return null;
	}
}

function store(value: Theme): void {
	try {
		localStorage.setItem(KEY, value);
	} catch {
		// Not persisted; the choice still applies for this page view.
	}
}

export const theme = {
	/** The theme to apply right now. */
	get current(): Theme {
		return current;
	},
	set(next: Theme) {
		current = next;
		store(next);
	},
	toggle() {
		theme.set(current === 'dark' ? 'light' : 'dark');
	}
};

/**
 * Adopt the persisted choice. Call once on mount; `app.html` has already applied the
 * same value to `<html>` before first paint, so this only syncs the store to it.
 */
export function initTheme(): void {
	const saved = readStored();
	current = saved === 'light' || saved === 'dark' ? saved : DEFAULT;
}
