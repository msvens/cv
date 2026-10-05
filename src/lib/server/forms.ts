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
 * lost, with a message per field (the old admin only said "Validation failed").
 */
export function invalid<V extends Record<string, unknown>>(values: V, error: z.ZodError) {
	const errors: FieldErrors = z.flattenError(error).fieldErrors;
	return fail(400, { values, errors });
}
