<script lang="ts">
	import { enhance } from '$app/forms';
	import BilingualField from '$lib/components/admin/BilingualField.svelte';
	import CheckboxField from '$lib/components/admin/CheckboxField.svelte';
	import FormMessage from '$lib/components/admin/FormMessage.svelte';
	import PhotoForms from '$lib/components/admin/PhotoForms.svelte';
	import SubmitButton from '$lib/components/admin/SubmitButton.svelte';
	import TextField from '$lib/components/admin/TextField.svelte';

	let { data, form } = $props();

	// After a failed save, show what was submitted (with the errors); otherwise the stored profile.
	const p = $derived(form && 'values' in form ? form.values : data.profile);
	const errors: Partial<Record<string, string[]>> = $derived(
		(form && 'errors' in form && form.errors) || {}
	);
	let pending = $state(false);
</script>

<h1 class="mb-6 text-2xl font-light text-neutral-900 dark:text-neutral-100">Profile</h1>

{#if !p}
	<FormMessage kind="error" text="There is no profile yet (run pnpm db:seed)." />
{:else}
	<PhotoForms
		photoUrl={data.profile?.photoUrl ?? null}
		message={form && 'photoMessage' in form ? form.photoMessage : undefined}
		error={form && 'photoError' in form ? form.photoError : undefined}
		urlValue={form && 'photoUrlValue' in form ? form.photoUrlValue : undefined}
	/>

	<form
		method="POST"
		action="?/save"
		class="max-w-3xl space-y-6"
		use:enhance={() => {
			pending = true;
			return async ({ update }) => {
				await update({ reset: false });
				pending = false;
			};
		}}
	>
		{#if form && 'saved' in form}
			<FormMessage kind="success" text="Profile saved." />
		{:else if form && 'errors' in form}
			<FormMessage kind="error" text="Please fix the fields marked below." />
		{:else if form && 'message' in form && form.message}
			<FormMessage kind="error" text={form.message} />
		{/if}

		<TextField label="Name" name="name" value={p.name} required errors={errors.name} />
		<BilingualField
			label="Title"
			nameEn="titleEn"
			nameSv="titleSv"
			valueEn={p.titleEn}
			valueSv={p.titleSv}
			errorsEn={errors.titleEn}
			errorsSv={errors.titleSv}
		/>
		<TextField
			label="Email"
			name="email"
			type="email"
			value={p.email}
			required
			errors={errors.email}
		/>
		<TextField label="Phone" name="phone" value={p.phone} errors={errors.phone} />
		<BilingualField
			label="Location"
			nameEn="locationEn"
			nameSv="locationSv"
			valueEn={p.locationEn}
			valueSv={p.locationSv}
			errorsEn={errors.locationEn}
			errorsSv={errors.locationSv}
		/>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div class="space-y-2">
				<TextField
					label="GitHub username"
					name="github"
					value={p.github}
					hint="Username only. Filled from your GitHub login when empty."
					errors={errors.github}
				/>
				<CheckboxField label="Show GitHub link" name="showGithub" checked={p.showGithub} />
			</div>
			<div class="space-y-2">
				<TextField
					label="LinkedIn username"
					name="linkedin"
					value={p.linkedin}
					hint="Username only: the part after linkedin.com/in/"
					errors={errors.linkedin}
				/>
				<CheckboxField label="Show LinkedIn link" name="showLinkedin" checked={p.showLinkedin} />
			</div>
		</div>

		<CheckboxField label="Available for opportunities" name="available" checked={p.available} />

		<BilingualField
			label="Bio (Markdown)"
			nameEn="bioEn"
			nameSv="bioSv"
			valueEn={p.bioEn}
			valueSv={p.bioSv}
			markdown
			rows={8}
			errorsEn={errors.bioEn}
			errorsSv={errors.bioSv}
		/>

		<SubmitButton {pending} />
	</form>
{/if}
