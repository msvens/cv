import { fail } from '@sveltejs/kit';
import { z } from 'zod/v4';

/** A text field's value, trimmed; '' when absent. */
export function text(form: FormData, name: string): string {
	const value = form.get(name);
	return typeof value === 'string' ? value.trim() : '';
}

/** A checkbox: browsers send 'on' when checked and nothing at all when not. */
export function checkbox(form: FormData, name: string): boolean {
	return form.get(name) === 'on';
}

/** An optional column: an empty field is stored as NULL, not ''. */
export function nullIfBlank(value: string): string | null {
	return value === '' ? null : value;
}

export type FieldErrors = Partial<Record<string, string[]>>;

/**
 * A 400 for a form that failed validation: the submitted values go back so nothing typed is
 * lost, with a message per field (the old admin only said "Validation failed"). `target` tells
 * a page with several forms which one to reopen.
 */
export function invalid<V extends Record<string, unknown>>(
	values: V,
	error: z.ZodError,
	target?: string
) {
	const errors: FieldErrors = z.flattenError(error).fieldErrors;
	return fail(400, { values, errors, target });
}

/** A positive integer field (e.g. a hidden row id), or null when missing or malformed. */
export function positiveInt(form: FormData, name: string): number | null {
	const n = Number(text(form, name));
	return Number.isInteger(n) && n > 0 ? n : null;
}
