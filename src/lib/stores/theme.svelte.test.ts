import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initTheme, theme } from './theme.svelte';

describe('theme store', () => {
	beforeEach(() => {
		localStorage.clear();
		initTheme();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('defaults to light, matching the Next app', () => {
		expect(theme.current).toBe('light');
	});

	it('persists an explicit choice', () => {
		theme.set('dark');
		expect(theme.current).toBe('dark');
		expect(localStorage.getItem('theme')).toBe('dark');
	});

	it('adopts the persisted choice on init', () => {
		localStorage.setItem('theme', 'dark');
		initTheme();
		expect(theme.current).toBe('dark');
	});

	it('falls back to light when the stored value is junk', () => {
		localStorage.setItem('theme', 'chartreuse');
		initTheme();
		expect(theme.current).toBe('light');
	});

	it('toggles between the two themes', () => {
		theme.toggle();
		expect(theme.current).toBe('dark');
		theme.toggle();
		expect(theme.current).toBe('light');
	});

	describe('when storage is unavailable', () => {
		it('falls back to light if reading throws', () => {
			localStorage.setItem('theme', 'dark');
			vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
				throw new DOMException('denied', 'SecurityError');
			});
			expect(() => initTheme()).not.toThrow();
			expect(theme.current).toBe('light');
		});

		it('still applies a choice if writing throws', () => {
			vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
				throw new DOMException('quota', 'QuotaExceededError');
			});
			expect(() => theme.set('dark')).not.toThrow();
			expect(theme.current).toBe('dark');
		});
	});
});
