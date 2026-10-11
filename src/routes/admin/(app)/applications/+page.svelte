<script lang="ts">
	import { enhance } from '$app/forms';
	import { attentionLabel, statusLabel } from '$lib/applications';
	import FormMessage from '$lib/components/admin/FormMessage.svelte';
	import SubmitButton from '$lib/components/admin/SubmitButton.svelte';
	import TextField from '$lib/components/admin/TextField.svelte';
	import { formatIsoDay } from '$lib/dates';
	import type { ApplicationData } from '$lib/types';

	let { data, form } = $props();

	// A failed create comes back with the submitted values: keep the form open with them.
	const failed = $derived(form && 'values' in form && form.values ? form.values : null);
	const errors: Partial<Record<string, string[]>> = $derived(
		(form && 'errors' in form && form.errors) || {}
	);
	let showNew = $state(false);
	let pending = $state(false);

	const empty = $derived(data.active.length === 0 && data.closed.length === 0);
	const attentionById = $derived(new Map(data.attention.map((a) => [a.application.id, a])));
	const tag = {
		overdue: 'text-red-600 dark:text-red-400',
		soon: 'text-amber-700 dark:text-amber-400'
	};
	const heading = 'mb-2 text-sm font-medium text-neutral-500 uppercase';
</script>

<h1 class="mb-6 text-2xl font-light text-neutral-900 dark:text-neutral-100">Applications</h1>

{#snippet list(applications: ApplicationData[])}
	<ul class="space-y-2">
		{#each applications as a (a.id)}
			{@const due = attentionById.get(a.id)}
			<li class="rounded border border-neutral-200 p-4 dark:border-neutral-800">
				<a
					href="/admin/applications/{a.id}"
					class="font-medium text-neutral-900 hover:underline dark:text-neutral-100"
					>{a.company} · {a.role}</a
				>
				<div class="mt-1 text-xs text-neutral-500">
					{#if due}<span class="{tag[due.kind]} font-medium">{attentionLabel(due)}</span> ·
					{/if}{statusLabel(a.status)}{a.deadline
						? ` · deadline ${formatIsoDay(a.deadline)}`
						: ''}{a.appliedOn ? ` · applied ${formatIsoDay(a.appliedOn)}` : ''}
				</div>
			</li>
		{/each}
	</ul>
{/snippet}

<div class="space-y-6">
	{#if empty}
		<p class="text-sm text-neutral-500">
			No applications yet. Add the first one with “New application” below.
		</p>
	{/if}

	{#if data.attention.length}
		<section
			aria-labelledby="attention-heading"
			class="rounded border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30"
		>
			<h2 id="attention-heading" class="mb-2 font-medium text-neutral-900 dark:text-neutral-100">
				Needs attention
			</h2>
			<ul class="space-y-1 text-sm">
				{#each data.attention as due (due.application.id)}
					<li>
						<a href="/admin/applications/{due.application.id}" class="hover:underline"
							>{due.application.company} · {due.application.role}</a
						>
						— <span class="{tag[due.kind]} font-medium">{attentionLabel(due)}</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if data.active.length}
		<section>
			<h2 class={heading}>Active</h2>
			{@render list(data.active)}
		</section>
	{/if}

	{#if showNew || failed}
		<form
			method="POST"
			action="?/create"
			class="max-w-xl space-y-4 rounded border border-neutral-200 p-4 dark:border-neutral-800"
			use:enhance={() => {
				pending = true;
				return async ({ update }) => {
					await update();
					pending = false;
				};
			}}
		>
			<h2 class="font-medium text-neutral-900 dark:text-neutral-100">New application</h2>
			{#if failed}
				<FormMessage kind="error" text="Please fix the fields marked below." />
			{/if}
			<TextField
				label="Company"
				name="company"
				value={failed?.company}
				required
				errors={errors.company}
			/>
			<TextField label="Role" name="role" value={failed?.role} required errors={errors.role} />
			<div class="flex gap-2">
				<SubmitButton {pending} label="Create" />
				<button
					type="button"
					class="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-700"
					onclick={() => (showNew = false)}>Cancel</button
				>
			</div>
		</form>
	{:else}
		<button
			class="rounded border border-neutral-300 px-4 py-2 text-sm transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
			onclick={() => (showNew = true)}>+ New application</button
		>
	{/if}

	{#if data.closed.length}
		<section>
			<h2 class={heading}>Closed</h2>
			{@render list(data.closed)}
		</section>
	{/if}
</div>
