<script lang="ts">
	export let title: string;
	export let description: string = '';
</script>

<div class="section-header">
	<div class="section-header-content">
		<h2>{title}</h2>
		{#if description}
			<p class="section-description">{description}</p>
		{/if}
	</div>
	{#if $$slots.actions}
		<div class="section-actions">
			<slot name="actions" />
		</div>
	{/if}
</div>

<style lang="scss">
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 2rem;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid rgba(var(--color--text-rgb), 0.08);
	}

	.section-header-content {
		flex: 1;
	}

	.section-header h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--color--text);
		margin: 0 0 0.5rem 0;
		font-family: var(--font--default);
	}

	.section-description {
		color: var(--color--text-shade);
		font-size: 0.95rem;
		margin: 0;
		line-height: 1.5;
		font-family: var(--font--default);
	}

	.section-actions {
		display: flex;
		gap: 0.75rem;
		flex-shrink: 0;
		flex-wrap: wrap;
	}

	@media (max-width: 768px) {
		.section-header {
			flex-direction: column;
			gap: 1rem;
		}

		.section-header h2 {
			font-size: 1.25rem;
		}

		.section-actions {
			width: 100%;
		}
	}
</style>
