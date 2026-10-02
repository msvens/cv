import { describe, expect, it } from 'vitest';
import { safeHref } from '../markdown';

describe('safeHref', () => {
	it.each([
		'https://example.com',
		'http://example.com/a?b=c',
		'mailto:a@b.c',
		'HTTPS://EXAMPLE.COM'
	])('allows %s', (href) => {
		expect(safeHref(href)).toBe(href);
	});

	it('trims surrounding whitespace', () => {
		expect(safeHref('  https://example.com ')).toBe('https://example.com');
	});

	it.each([
		'javascript:alert(1)',
		' JavaScript:alert(1)',
		'java\tscript:alert(1)', // browsers strip tabs/newlines inside the scheme
		'data:text/html,<script>alert(1)</script>',
		'vbscript:x',
		'//evil.example',
		'/relative',
		''
	])('rejects %j', (href) => {
		expect(safeHref(href)).toBeNull();
	});
});
