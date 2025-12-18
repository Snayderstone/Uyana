<script lang="ts">
	export let title: string = 'Sin contenido';
	export let message: string = 'No hay información disponible en este momento';
	export let icon: string = 'ℹ️';
</script>

<div class="empty-state">
	<div class="empty-icon">{icon}</div>
	<h3>{title}</h3>
	<p>{message}</p>
	{#if $$slots.default}
		<div class="empty-actions">
			<slot />
		</div>
	{/if}
</div>

<style lang="scss">
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		color: var(--color--text-shade);
		min-height: 300px;
	}

	.empty-icon {
		font-size: 4rem;
		line-height: 1;
		opacity: 0.3;
		margin-bottom: 1.5rem;
		animation: float 3s ease-in-out infinite;
	}

	@keyframes float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
	}

	.empty-state h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color--text);
		margin: 0 0 0.75rem 0;
		font-family: var(--font--default);
	}

	.empty-state p {
		font-size: 0.95rem;
		max-width: 500px;
		margin: 0;
		line-height: 1.6;
		font-family: var(--font--default);
	}

	.empty-actions {
		margin-top: 1.5rem;
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	@media (max-width: 768px) {
		.empty-state {
			padding: 3rem 1.5rem;
			min-height: 250px;
		}

		.empty-icon {
			font-size: 3rem;
		}

		.empty-state h3 {
			font-size: 1.125rem;
		}

		.empty-state p {
			font-size: 0.875rem;
		}
	}
</style>
