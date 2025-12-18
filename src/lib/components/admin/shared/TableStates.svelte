<script lang="ts">
	export let state: 'loading' | 'error' | 'empty' = 'loading';
	export let errorMessage = 'Ha ocurrido un error';
	export let emptyMessage = 'No se encontraron registros';
	export let onRetry: (() => void) | null = null;
	export let actionLabel = 'Crear Registro';
	export let actionHref: string | null = null;
</script>

{#if state === 'loading'}
	<div class="loading-state">
		<div class="spinner" />
		<p>Cargando datos...</p>
	</div>
{:else if state === 'error'}
	<div class="error-state">
		<div class="error-icon">⚠️</div>
		<p class="error-message">{errorMessage}</p>
		{#if onRetry}
			<button class="btn btn-primary" on:click={onRetry}>Reintentar</button>
		{/if}
	</div>
{:else if state === 'empty'}
	<div class="empty-state">
		<div class="empty-icon">📂</div>
		<p class="empty-message">{emptyMessage}</p>
		{#if actionHref}
			<a href={actionHref} class="btn btn-primary">{actionLabel}</a>
		{/if}
	</div>
{/if}

<style lang="scss">
	.loading-state,
	.error-state,
	.empty-state {
		padding: 4rem 2rem;
		text-align: center;
		color: var(--color--text-shade);

		p {
			margin: 1rem 0;
			font-size: 0.9375rem;
		}
	}

	.loading-state {
		.spinner {
			width: 40px;
			height: 40px;
			border: 4px solid var(--color--border);
			border-top-color: var(--color--primary);
			border-radius: 50%;
			animation: spin 0.8s linear infinite;
			margin: 0 auto 1rem;
		}

		@keyframes spin {
			to {
				transform: rotate(360deg);
			}
		}
	}

	.error-state {
		.error-icon {
			font-size: 3rem;
			margin-bottom: 1rem;
		}

		.error-message {
			color: #ef4444;
			font-weight: 500;
		}
	}

	.empty-state {
		.empty-icon {
			font-size: 3rem;
			margin-bottom: 1rem;
			opacity: 0.5;
		}

		.empty-message {
			margin-bottom: 1.5rem;
		}
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1.25rem;
		border: 1px solid transparent;
		border-radius: 8px;
		font-size: 0.9375rem;
		font-weight: 500;
		cursor: pointer;
		text-decoration: none;
		transition: all 0.15s ease;

		&.btn-primary {
			background: linear-gradient(135deg, var(--color--primary), #5a1fb8);
			color: white;

			&:hover {
				transform: translateY(-2px);
				box-shadow: 0 8px 16px rgba(110, 41, 231, 0.3);
			}
		}
	}
</style>
