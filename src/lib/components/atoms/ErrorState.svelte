<script lang="ts">
	export let title: string = 'Error';
	export let message: string;
	export let icon: string = '⚠️';
	export let onRetry: (() => void) | undefined = undefined;
	export let retryText: string = 'Reintentar';
</script>

<div class="error-state">
	<div class="error-icon">{icon}</div>
	<h3>{title}</h3>
	<p>{message}</p>
	{#if onRetry}
		<button class="btn-retry" on:click={onRetry}>{retryText}</button>
	{/if}
	<slot />
</div>

<style lang="scss">
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		color: var(--color--text-shade, #6b7280);
	}

	.error-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
		animation: shake 0.5s ease-in-out;
	}

	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-10px);
		}
		75% {
			transform: translateX(10px);
		}
	}

	h3 {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color--text, #1a1a1a);
		margin: 0 0 0.5rem 0;
		font-family: var(--font--default);
	}

	p {
		font-size: 1rem;
		max-width: 500px;
		margin: 0 0 1.5rem 0;
		line-height: 1.6;
		color: var(--color--text-shade, #6b7280);
		font-family: var(--font--default);
	}

	.btn-retry {
		padding: 0.75rem 1.5rem;
		background: var(--color--primary, #3b82f6);
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 600;
		font-size: 0.95rem;
		font-family: var(--font--default);
		transition: all 0.3s ease;

		&:hover {
			background: var(--color--primary-shade, #2563eb);
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
		}

		&:active {
			transform: translateY(0);
		}
	}
</style>
