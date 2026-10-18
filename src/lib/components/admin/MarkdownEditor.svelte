<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { ArrowsPointingIn, ArrowsPointingOut, Eye, EyeSlash, Icon } from 'svelte-hero-icons';
	import Markdown from '$lib/components/resume/Markdown.svelte';
	import { htmlToMarkdown } from '$lib/htmlToMarkdown';
	import { prefixLine, replaceSelection, wrapSelection, type Edit } from '$lib/markdownEdit';
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

	// Hiding the preview gives the text the full width. Each editor has its own setting, kept
	// in this browser per field; localStorage can throw (storage disabled), and then it isn't.
	const previewKey = $derived(`md-preview:${id}`);
	let showPreview = $state(true);
	onMount(() => {
		try {
			showPreview = localStorage.getItem(previewKey) !== 'off';
		} catch {
			// Not stored: the preview shows.
		}
	});
	function togglePreview() {
		showPreview = !showPreview;
		try {
			localStorage.setItem(previewKey, showPreview ? 'on' : 'off');
		} catch {
			// Not persisted; the choice still applies on this page.
		}
	}

	// Expanded: the editor fills the window until Esc or the button; the page behind holds still.
	let expanded = $state(false);
	$effect(() => {
		if (!expanded) return;
		const overflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = overflow;
		};
	});
	async function toggleExpanded() {
		expanded = !expanded;
		await tick();
		textarea?.focus();
	}

	// Formatted text (Google Docs, web pages…) pastes as markdown; plain text and code-editor
	// HTML paste as usual.
	async function paste(event: ClipboardEvent) {
		const html = event.clipboardData?.getData('text/html');
		const markdown = html ? htmlToMarkdown(html) : null;
		if (markdown === null) return;
		event.preventDefault();
		// insertText keeps the paste on the textarea's undo stack (Cmd+Z). It is deprecated, but
		// every browser supports it and nothing else can; without it, set the value directly.
		if (document.execCommand?.('insertText', false, markdown)) return;
		await apply((el) => replaceSelection(value, el.selectionStart, el.selectionEnd, markdown));
	}

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

<svelte:window
	onkeydown={(e) => {
		if (expanded && e.key === 'Escape') toggleExpanded();
	}}
/>

<div class={[expanded && 'fixed inset-0 z-70 flex flex-col bg-white p-4 dark:bg-neutral-950']}>
	{#if label}<label for={id} class="mb-1 block text-xs text-neutral-500">{label}</label>{/if}
	<div
		class={[
			'overflow-hidden rounded border border-neutral-300 dark:border-neutral-700',
			expanded && 'flex min-h-0 flex-1 flex-col'
		]}
	>
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
			<span class="ml-auto flex gap-1">
				<button
					type="button"
					class={toolButton}
					aria-label="Preview"
					aria-pressed={showPreview}
					title={showPreview ? 'Hide the preview' : 'Show the preview'}
					onclick={togglePreview}
				>
					<Icon src={showPreview ? Eye : EyeSlash} class="h-4 w-4" />
				</button>
				<button
					type="button"
					class={toolButton}
					aria-label="Expand"
					aria-pressed={expanded}
					title={expanded ? 'Back to the page (Esc)' : 'Fill the window'}
					onclick={toggleExpanded}
				>
					<Icon src={expanded ? ArrowsPointingIn : ArrowsPointingOut} class="h-4 w-4" />
				</button>
			</span>
		</div>
		<!-- Text and live preview: side by side on desktop, stacked on mobile. -->
		<div
			class={['grid grid-cols-1', showPreview && 'md:grid-cols-2', expanded && 'min-h-0 flex-1']}
		>
			<textarea
				bind:this={textarea}
				bind:value
				{id}
				{name}
				{rows}
				onpaste={paste}
				class={[
					'w-full resize-y bg-white px-3 py-2 font-mono text-sm text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100',
					expanded && 'h-full resize-none'
				]}></textarea>
			{#if showPreview}
				<!-- Side by side, the preview fills the textarea's height and scrolls: the textarea
				     alone sets the editor's height, so showing or hiding the preview never changes it. -->
				<div
					class={[
						'relative border-t border-neutral-300 bg-neutral-50/50 text-sm leading-relaxed text-neutral-700 md:border-t-0 md:border-l dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-300',
						expanded && 'overflow-auto'
					]}
					aria-label="Preview"
					role="region"
					data-testid="markdown-preview"
				>
					<div class="px-3 py-2 md:absolute md:inset-0 md:overflow-auto">
						{#if value.trim()}
							<Markdown blocks={preview} />
						{:else}
							<span class="text-neutral-400 italic">Nothing to preview</span>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
