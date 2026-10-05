<script lang="ts">
	import { tick } from 'svelte';
	import Markdown from '$lib/components/resume/Markdown.svelte';
	import { prefixLine, wrapSelection, type Edit } from '$lib/markdownEdit';
	import { parseMarkdown } from '$lib/markdownParse';

	let {
		name,
		id = name,
		value: initial = '',
		rows = 6,
		label
	}: { name: string; id?: string; value?: string; rows?: number; label?: string } = $props();

	// Follows the `value` prop (e.g. when a save reloads the data) and is edited locally in
	// between: a writable $derived. The textarea is what the form submits.
	let value = $derived(initial);
	let textarea: HTMLTextAreaElement | undefined = $state();

	// Live preview: the same parser and renderer as the public page, so what you see is what
	// gets published.
	const preview = $derived(parseMarkdown(value));

	async function apply(edit: (el: HTMLTextAreaElement) => Edit) {
		if (!textarea) return;
		const next = edit(textarea);
		value = next.value;
		await tick();
		textarea.focus();
		textarea.setSelectionRange(next.selectionStart, next.selectionEnd);
	}

	const wrap = (before: string, after: string, placeholder: string) =>
		apply((el) =>
			wrapSelection(value, el.selectionStart, el.selectionEnd, before, after, placeholder)
		);
	const prefix = (marker: string) => apply((el) => prefixLine(value, el.selectionStart, marker));

	const tools: { label: string; title: string; class?: string; run: () => void }[] = [
		{ label: 'H1', title: 'Heading 1', run: () => prefix('# ') },
		{ label: 'H2', title: 'Heading 2', run: () => prefix('## ') },
		{ label: 'H3', title: 'Heading 3', run: () => prefix('### ') },
		{ label: 'B', title: 'Bold', class: 'font-bold', run: () => wrap('**', '**', 'bold text') },
		{ label: 'I', title: 'Italic', class: 'italic', run: () => wrap('*', '*', 'italic text') },
		{ label: '• List', title: 'Bullet list', run: () => prefix('- ') },
		{ label: '1. List', title: 'Numbered list', run: () => prefix('1. ') },
		{ label: 'Link', title: 'Link', run: () => wrap('[', '](https://)', 'link text') }
	];
	const toolButton =
		'rounded px-2 py-0.5 text-xs text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100';
</script>

<div>
	{#if label}<label for={id} class="mb-1 block text-xs text-neutral-500">{label}</label>{/if}
	<div class="overflow-hidden rounded border border-neutral-300 dark:border-neutral-700">
		<div
			role="toolbar"
			aria-label="Formatting"
			class="flex flex-wrap items-center gap-1 border-b border-neutral-300 bg-neutral-50 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-800"
		>
			{#each tools as tool (tool.label)}
				<button type="button" class={[toolButton, tool.class]} title={tool.title} onclick={tool.run}
					>{tool.label}</button
				>
			{/each}
		</div>
		<!-- Text and live preview: side by side on desktop, stacked on mobile. -->
		<div class="grid grid-cols-1 md:grid-cols-2">
			<textarea
				bind:this={textarea}
				bind:value
				{id}
				{name}
				{rows}
				class="w-full resize-y bg-white px-3 py-2 font-mono text-sm text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100"
			></textarea>
			<div
				class="border-t border-neutral-300 bg-neutral-50/50 px-3 py-2 text-sm leading-relaxed text-neutral-700 md:border-t-0 md:border-l dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-300"
				aria-label="Preview"
				role="region"
				data-testid="markdown-preview"
			>
				{#if value.trim()}
					<Markdown blocks={preview} />
				{:else}
					<span class="text-neutral-400 italic">Nothing to preview</span>
				{/if}
			</div>
		</div>
	</div>
</div>
