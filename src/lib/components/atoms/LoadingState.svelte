<script lang="ts">
	export let message: string = 'Cargando...';
	export let spinnerSize: 'small' | 'medium' | 'large' = 'medium';
</script>

<div class="loading-state">
	<div class="spinner {spinnerSize}" />
	<p>{message}</p>
</div>

<style lang="scss">
	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		gap: 1rem;
	}

	.spinner {
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		border-style: solid;
		border-color: rgba(var(--color--text-rgb, 0, 0, 0), 0.1);
		border-top-color: var(--color--primary, #3b82f6);

		&.small {
			width: 32px;
			height: 32px;
			border-width: 3px;
		}

		&.medium {
			width: 48px;
			height: 48px;
			border-width: 4px;
		}

		&.large {
			width: 64px;
			height: 64px;
			border-width: 5px;
		}
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	p {
		color: var(--color--text-shade, #6b7280);
		font-size: 1rem;
		margin: 0;
		font-family: var(--font--default);
	}
</style>
