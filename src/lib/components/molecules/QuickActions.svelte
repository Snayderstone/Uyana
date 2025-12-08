<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	export let isOpen = false;

	const dispatch = createEventDispatcher<{
		close: void;
		action: { command: string; label: string };
	}>();

	const quickActions = [
		{
			command: '/clear',
			label: 'Limpiar chat',
			icon: '🗑️',
			description: 'Eliminar todo el historial'
		},
		{ command: '/help', label: 'Mostrar ayuda', icon: '❓', description: 'Ver todos los comandos' },
		{ command: '/status', label: 'Ver estado', icon: '📊', description: 'Estado de conexión' },
		{
			command: '/model',
			label: 'Cambiar modelo',
			icon: '🤖',
			description: 'Seleccionar modelo de IA'
		}
	];

	function handleAction(action: (typeof quickActions)[0]) {
		dispatch('action', { command: action.command, label: action.label });
		dispatch('close');
	}

	function handleClose() {
		dispatch('close');
	}

	function handleDocumentKeydown(event: KeyboardEvent) {
		if (!isOpen) return;

		if (event.key === 'Escape') {
			event.preventDefault();
			handleClose();
		}
	}

	// Función para manejar teclas localmente en el panel
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			handleClose();
		}
	}

	onMount(() => {
		document.addEventListener('keydown', handleDocumentKeydown);
	});

	onDestroy(() => {
		document.removeEventListener('keydown', handleDocumentKeydown);
	});
</script>

{#if isOpen}
	<!-- Backdrop -->
	<div
		class="quick-actions-backdrop"
		transition:fade={{ duration: 200 }}
		on:click={handleClose}
		on:keydown={handleKeydown}
		role="button"
		tabindex="0"
	/>

	<!-- Panel -->
	<div
		class="quick-actions-panel"
		transition:fly={{ y: -20, duration: 300 }}
		role="dialog"
		aria-label="Accesos rápidos"
		on:keydown={handleKeydown}
		tabindex="-1"
	>
		<div class="quick-actions-header">
			<h3>⚡ Accesos Rápidos</h3>
			<button class="close-button" on:click={handleClose} aria-label="Cerrar">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
					<path
						d="M18 6L6 18M6 6L18 18"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
		</div>

		<div class="quick-actions-list">
			{#each quickActions as action, index}
				<button
					class="quick-action-item"
					on:click={() => handleAction(action)}
					transition:fly={{ y: 10, duration: 200, delay: index * 50 }}
				>
					<div class="action-icon">{action.icon}</div>
					<div class="action-content">
						<div class="action-label">{action.label}</div>
						<div class="action-description">{action.description}</div>
					</div>
					<div class="action-command">{action.command}</div>
				</button>
			{/each}
		</div>

		<div class="quick-actions-footer">
			<p>Presiona <kbd>Esc</kbd> para cerrar</p>
		</div>
	</div>
{/if}

<style lang="scss">
	.quick-actions-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(4px);
		z-index: 1000;
	}

	.quick-actions-panel {
		position: fixed;
		top: 20%;
		left: 50%;
		transform: translateX(-50%);
		width: 90%;
		max-width: 500px;
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--border-rgb), 0.2);
		border-radius: 16px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
		z-index: 1001;
		overflow: hidden;
	}

	.quick-actions-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px 24px;
		border-bottom: 1px solid rgba(var(--color--border-rgb), 0.1);

		h3 {
			margin: 0;
			font-size: 1.1rem;
			font-weight: 600;
			color: var(--color--text);
		}

		.close-button {
			width: 32px;
			height: 32px;
			border: none;
			background: transparent;
			color: rgba(var(--color--text-rgb), 0.6);
			cursor: pointer;
			border-radius: 8px;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.2s ease;

			&:hover {
				background: rgba(var(--color--text-rgb), 0.1);
				color: var(--color--text);
			}
		}
	}

	.quick-actions-list {
		padding: 8px;
		max-height: 400px;
		overflow-y: auto;
	}

	.quick-action-item {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 12px 16px;
		border: none;
		background: transparent;
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;

		&:hover {
			background: rgba(var(--color--primary-rgb), 0.08);
		}

		&:active {
			transform: scale(0.98);
		}
	}

	.action-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.action-content {
		flex: 1;
		min-width: 0;

		.action-label {
			font-size: 0.95rem;
			font-weight: 600;
			color: var(--color--text);
			margin-bottom: 2px;
		}

		.action-description {
			font-size: 0.8rem;
			color: rgba(var(--color--text-rgb), 0.6);
			line-height: 1.3;
		}
	}

	.action-command {
		font-size: 0.85rem;
		color: var(--color--primary);
		background: rgba(var(--color--primary-rgb), 0.1);
		padding: 4px 8px;
		border-radius: 6px;
		font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
		font-weight: 500;
	}

	.quick-actions-footer {
		padding: 16px 24px;
		border-top: 1px solid rgba(var(--color--border-rgb), 0.1);
		background: rgba(var(--color--border-rgb), 0.02);

		p {
			margin: 0;
			font-size: 0.8rem;
			color: rgba(var(--color--text-rgb), 0.6);
			text-align: center;

			kbd {
				background: rgba(var(--color--text-rgb), 0.1);
				color: var(--color--text);
				padding: 2px 6px;
				border-radius: 4px;
				font-size: 0.75rem;
				font-family: inherit;
				border: 1px solid rgba(var(--color--border-rgb), 0.2);
			}
		}
	}

	/* Responsive */
	@media (max-width: 768px) {
		.quick-actions-panel {
			top: 10%;
			width: 95%;
			max-width: none;
		}

		.quick-actions-header {
			padding: 16px 20px;

			h3 {
				font-size: 1rem;
			}
		}

		.quick-action-item {
			padding: 10px 12px;
			gap: 12px;
		}

		.action-icon {
			font-size: 1.3rem;
		}

		.action-content .action-label {
			font-size: 0.9rem;
		}

		.action-command {
			font-size: 0.8rem;
			padding: 3px 6px;
		}
	}
</style>
