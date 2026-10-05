import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { checkbox, invalid, nullIfBlank, text } from '../forms';

const form = (entries: Record<string, string>) => {
	const data = new FormData();
	for (const [k, v] of Object.entries(entries)) data.set(k, v);
	return data;
};

describe('form helpers', () => {
	it('reads text trimmed, and missing fields as empty', () => {
		const data = form({ name: '  Martin  ' });
		expect(text(data, 'name')).toBe('Martin');
		expect(text(data, 'missing')).toBe('');
	});

	it('reads a checkbox as checked only when sent', () => {
		expect(checkbox(form({ available: 'on' }), 'available')).toBe(true);
		expect(checkbox(form({}), 'available')).toBe(false);
	});

	it('stores a blank optional field as null', () => {
		expect(nullIfBlank('')).toBeNull();
		expect(nullIfBlank('x')).toBe('x');
	});

	it('returns a 400 with per-field messages and the submitted values', () => {
		const schema = z.object({ email: z.email('Not a valid email address'), name: z.string() });
		const values = { email: 'nope', name: 'Martin' };
		const result = schema.safeParse(values);
		if (result.success) throw new Error('expected invalid');
		const failure = invalid(values, result.error);
		expect(failure.status).toBe(400);
		expect(failure.data.values).toEqual(values);
		expect(failure.data.errors).toEqual({ email: ['Not a valid email address'] });
	});
});
