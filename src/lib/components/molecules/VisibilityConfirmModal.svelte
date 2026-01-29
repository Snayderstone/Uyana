<script lang="ts">
	import ConfirmModal from './ConfirmModal.svelte';
	import type { GraficoConfig } from '$lib/models/admin';

	export let isOpen = false;
	export let chartConfig: GraficoConfig | undefined = undefined;
	export let onConfirm: () => void | Promise<void>;
	export let onCancel: (() => void) | undefined = undefined;

	$: willBePublic = chartConfig ? !chartConfig.es_publico : false;
</script>

<ConfirmModal
	bind:isOpen
	title="Confirmar cambio de visibilidad"
	icon="warning"
	confirmText="Confirmar"
	cancelText="Cancelar"
	variant="primary"
	{onConfirm}
	{onCancel}
>
	{#if chartConfig}
		<p class="modal-main-text">
			Estás a punto de cambiar la visibilidad del gráfico <strong
				>"{chartConfig.titulo_display}"</strong
			>
		</p>

		<div class="status-change">
			<span class="status-badge current" class:public={chartConfig.es_publico}>
				{chartConfig.es_publico ? '🌐 Público' : '🔒 Privado'}
			</span>
			<svg
				class="arrow-icon"
				viewBox="0 0 24 24"
				width="24"
				height="24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<polyline points="9 18 15 12 9 6" />
			</svg>
			<span class="status-badge new" class:public={willBePublic}>
				{willBePublic ? '🌐 Público' : '🔒 Privado'}
			</span>
		</div>

		<p class="modal-warning">
			{#if willBePublic}
				✓ El gráfico será <strong>visible en la página pública</strong> de SIGPI para todos los visitantes.
			{:else}
				✓ El gráfico será <strong>visible solo para administradores</strong> en este panel.
			{/if}
		</p>
	{/if}
</ConfirmModal>

<style lang="scss">
	.modal-main-text {
		font-size: 1rem;
		color: var(--color--text, #1a1a1a);
		margin: 0 0 1.5rem 0;
		font-weight: 500;
		text-align: center;
		font-family: var(--font--default);

		strong {
			color: var(--color--primary, #6e29e7);
			font-weight: 700;
		}
	}

	.status-change {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin: 1.5rem 0;
		padding: 1.5rem;
		background: rgba(var(--color--primary-rgb, 110, 41, 231), 0.05);
		border-radius: 12px;
		border: 1px solid rgba(var(--color--primary-rgb, 110, 41, 231), 0.1);
	}

	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1.25rem;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.95rem;
		background: rgba(var(--color--text-rgb, 0, 0, 0), 0.06);
		color: var(--color--text-shade, #6b7280);
		border: 2px solid rgba(var(--color--text-rgb, 0, 0, 0), 0.1);
		font-family: var(--font--default);
		transition: all 0.3s ease;

		&.public {
			background: #dcfce7;
			color: #059669;
			border-color: #059669;
		}

		&.new {
			animation: pulse 2s ease-in-out infinite;
		}
	}

	@keyframes pulse {
		0%,
		100% {
			transform: scale(1);
			box-shadow: 0 0 0 0 rgba(110, 41, 231, 0.4);
		}
		50% {
			transform: scale(1.05);
			box-shadow: 0 0 0 8px rgba(110, 41, 231, 0);
		}
	}

	.arrow-icon {
		color: var(--color--primary, #6e29e7);
		flex-shrink: 0;
	}

	.modal-warning {
		font-size: 0.95rem;
		color: var(--color--text-shade, #6b7280);
		margin: 1.5rem 0 0 0;
		padding: 1rem;
		background: rgba(var(--color--primary-rgb, 110, 41, 231), 0.05);
		border-left: 3px solid var(--color--primary, #6e29e7);
		border-radius: 6px;
		line-height: 1.6;
		font-family: var(--font--default);

		strong {
			color: var(--color--primary, #6e29e7);
			font-weight: 700;
		}
	}
</style>
