<script lang="ts">
	export let title: string;
	export let description: string = '';
</script>

<section class="summary-section">
	<div class="section-header">
		<h2 class="section-title">{title}</h2>
		{#if description}
			<p class="section-description">{description}</p>
		{/if}
	</div>
	<div class="section-content">
		<slot />
	</div>
</section>

<style>
	.summary-section {
		margin-bottom: 2rem;
	}

	.section-header {
		margin-bottom: 1rem;
	}

	.section-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color--text);
		margin: 0 0 0.375rem 0;
		font-family: var(--font--title);
	}

	.section-description {
		font-size: 0.875rem;
		color: var(--color--text-secondary);
		margin: 0;
		line-height: 1.5;
	}
</style>
