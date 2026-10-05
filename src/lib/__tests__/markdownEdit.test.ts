import { describe, expect, it } from 'vitest';
import { prefixLine, wrapSelection } from '../markdownEdit';

describe('wrapSelection', () => {
	it('wraps the selected text and keeps it selected', () => {
		const edit = wrapSelection('say hello', 4, 9, '**', '**', 'bold text');
		expect(edit.value).toBe('say **hello**');
		expect(edit.value.slice(edit.selectionStart, edit.selectionEnd)).toBe('hello');
	});

	it('inserts and selects a placeholder when nothing is selected', () => {
		const edit = wrapSelection('ab', 1, 1, '*', '*', 'italic text');
		expect(edit.value).toBe('a*italic text*b');
		expect(edit.value.slice(edit.selectionStart, edit.selectionEnd)).toBe('italic text');
	});
});

describe('prefixLine', () => {
	it('adds a marker to the start of the cursor line, keeping the cursor on its text', () => {
		const edit = prefixLine('first\nsecond', 9, '- '); // cursor inside "second", after "sec"
		expect(edit.value).toBe('first\n- second');
		expect(edit.value.slice(edit.selectionStart)).toBe('ond');
	});

	it.each([
		['# ', '# Title'],
		['## ', '## Title'],
		['### ', '### Title'],
		['1. ', '1. Title']
	])('adds %j', (prefix, expected) => {
		expect(prefixLine('Title', 0, prefix).value).toBe(expected);
	});

	it('replaces an existing marker instead of stacking (H1 → H2, bullet → number)', () => {
		expect(prefixLine('# Title', 3, '## ').value).toBe('## Title');
		expect(prefixLine('- item', 3, '1. ').value).toBe('1. item');
	});

	it('removes the marker when the same one is applied again', () => {
		expect(prefixLine('## Title', 5, '## ').value).toBe('Title');
	});

	it('keeps indentation, for nested lists', () => {
		expect(prefixLine('- a\n  b', 7, '- ').value).toBe('- a\n  - b');
	});
});
