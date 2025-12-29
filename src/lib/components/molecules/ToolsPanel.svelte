<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import Button from '$lib/components/atoms/Button.svelte';
	import ToolInfoPopup from './ToolInfoPopup.svelte';

	// Props
	export let isOpen = false;
	export let tools: any[] = [];
	export let activeTools: Set<string> = new Set();

	// Estado del popup de información
	let isToolInfoOpen = false;
	let selectedTool: any = null;

	const dispatch = createEventDispatcher<{
		close: void;
		toggleTool: { toolName: string };
		useQuestion: { question: string };
	}>();

	function handleClose() {
		dispatch('close');
	}

	function handleToolToggle(toolName: string) {
		dispatch('toggleTool', { toolName });
	}

	// Función para obtener el emoji de la herramienta
	function getToolEmoji(toolName: string): string {
		const emojiMap: Record<string, string> = {
			weather: '🌤️',
			time: '🕒',
			chart: '📊',
			search: '🔍',
			document: '📄',
			chat: '💬',
			map: '🗺️',
			geo: '🌍',
			data: '💾',
			'fecha-tiempo-ecuador': '🕒',
			'proyectos-uce': '📊'
		};
		return emojiMap[toolName] || '⚙️';
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleClose();
		}
	}

	function showToolInfo(tool: any) {
		selectedTool = tool;
		isToolInfoOpen = true;
	}

	function handleInfoClose() {
		isToolInfoOpen = false;
	}

	function handleActivateTool(event: CustomEvent<{ toolName: string }>) {
		const { toolName } = event.detail;
		if (!activeTools.has(toolName)) {
			handleToolToggle(toolName);
		}
	}

	function handleUseQuestion(event: CustomEvent<{ question: string }>) {
		// Reenviar el evento con la pregunta seleccionada
		dispatch('useQuestion', { question: event.detail.question });
		handleClose();
	}
</script>

{#if isOpen}
	<!-- Backdrop -->
	<div
		class="tools-backdrop"
		on:click={handleBackdropClick}
		role="button"
		tabindex="-1"
		on:keydown={(e) => e.key === 'Escape' && handleClose()}
		transition:fade={{ duration: 200 }}
	>
		<!-- Panel de herramientas -->
		<div class="tools-panel" transition:fly={{ y: 20, duration: 300 }}>
			<div class="tools-panel-header">
				<h3>🔧 Herramientas Disponibles</h3>
				<button class="close-button" on:click={handleClose} aria-label="Cerrar panel">
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

			<div class="tools-list">
				{#each tools as tool}
					<div class="tool-item">
						<label class="tool-checkbox">
							<input
								type="checkbox"
								checked={activeTools.has(tool.name)}
								on:change={() => handleToolToggle(tool.name)}
							/>
							<div class="checkbox-custom">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
									<path
										d="M20 6L9 17L4 12"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							</div>
							<span class="tool-icon">{getToolEmoji(tool.name)}</span>
							<span class="tool-name">{tool.title || tool.name}</span>
						</label>
						<div class="tool-description">{tool.description}</div>
						<div class="tool-actions">
							<button class="info-button" on:click|stopPropagation={() => showToolInfo(tool)}>
								<span class="info-icon">ℹ️</span>
								<span>Más info</span>
							</button>
						</div>
					</div>
				{:else}
					<div class="no-tools">
						<div class="no-tools-icon">🔧</div>
						<p>No hay herramientas disponibles</p>
						<small>Verifica la conexión con el servidor MCP</small>
					</div>
				{/each}
			</div>

			<div class="tools-panel-footer">
				<div class="active-count">
					{activeTools.size} herramienta{activeTools.size !== 1 ? 's' : ''} activa{activeTools.size !==
					1
						? 's'
						: ''}
				</div>
				<Button color="primary" style="solid" size="small" on:click={handleClose}>Aplicar</Button>
			</div>
		</div>
	</div>
{/if}

<!-- Popup de información de herramienta -->
<ToolInfoPopup
	isOpen={isToolInfoOpen}
	tool={selectedTool}
	on:close={handleInfoClose}
	on:activateTool={handleActivateTool}
	on:useQuestion={handleUseQuestion}
/>

<style lang="scss">
	.tools-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
		backdrop-filter: blur(4px);
	}

	.tools-panel {
		background: var(--color--card-background);
		border-radius: 16px;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
		width: 100%;
		max-width: 500px;
		max-height: 80vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		border: 1px solid rgba(var(--color--border-rgb), 0.1);
	}

	.tools-panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid rgba(var(--color--border-rgb), 0.1);
		background: linear-gradient(
			135deg,
			rgba(var(--color--primary-rgb), 0.04),
			rgba(var(--color--secondary-rgb), 0.04)
		);

		h3 {
			margin: 0;
			font-size: 0.95rem;
			font-weight: 600;
			color: var(--color--text);
		}

		.close-button {
			width: 28px;
			height: 28px;
			border-radius: 6px;
			border: none;
			background: rgba(var(--color--text-rgb), 0.08);
			display: flex;
			align-items: center;
			justify-content: center;
			color: var(--color--text-shade);
			cursor: pointer;
			transition: all 0.2s ease;

			&:hover {
				background: rgba(var(--color--text-rgb), 0.12);
				color: var(--color--text);
			}
		}
	}

	.tools-list {
		flex: 1;
		padding: 0.75rem 0;
		overflow-y: auto;
		max-height: 350px;

		/* Scrollbar personalizada */
		&::-webkit-scrollbar {
			width: 4px;
		}

		&::-webkit-scrollbar-track {
			background: transparent;
		}

		&::-webkit-scrollbar-thumb {
			background: rgba(var(--color--border-rgb), 0.3);
			border-radius: 2px;
		}
	}

	.tool-item {
		padding: 0.625rem 1.25rem;
		transition: background-color 0.2s ease;
		border-left: 2px solid transparent;

		&:hover {
			background-color: rgba(var(--color--primary-rgb), 0.03);
			border-left-color: rgba(var(--color--primary-rgb), 0.3);
		}
	}

	.tool-checkbox {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		cursor: pointer;
		user-select: none;
		margin-bottom: 0.375rem;
		position: relative;

		input[type='checkbox'] {
			position: absolute;
			opacity: 0;
			width: 0;
			height: 0;

			&:checked + .checkbox-custom {
				background: var(--color--primary);
				border-color: var(--color--primary);
				color: white;

				svg {
					opacity: 1;
					transform: scale(1);
				}
			}
		}

		.checkbox-custom {
			width: 18px;
			height: 18px;
			border: 2px solid rgba(var(--color--text-rgb), 0.6);
			border-radius: 4px;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.2s ease;
			background: var(--color--card-background);

			svg {
				opacity: 0;
				transform: scale(0.5);
				transition: all 0.2s ease;
				width: 12px;
				height: 12px;
			}
		}

		.tool-icon {
			font-size: 0.9rem;
			flex-shrink: 0;
		}

		.tool-name {
			font-weight: 500;
			color: var(--color--text);
			font-size: 0.8rem;
		}
	}

	.tool-description {
		margin-left: 2.625rem;
		font-size: 0.7rem;
		color: var(--color--text-shade);
		line-height: 1.3;
		opacity: 0.85;
	}

	.tool-actions {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		margin-left: 2.625rem;
		margin-top: 0.375rem;
	}

	.info-button {
		background: none;
		border: none;
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		color: var(--color--text-shade);
		display: flex;
		align-items: center;
		gap: 0.25rem;
		cursor: pointer;
		border-radius: 4px;
		transition: all 0.2s ease;

		&:hover {
			background: rgba(var(--color--primary-rgb), 0.05);
			color: var(--color--primary);
		}

		.info-icon {
			font-size: 0.85rem;
		}
	}

	.no-tools {
		padding: 2rem;
		text-align: center;
		color: var(--color--text-shade);

		.no-tools-icon {
			font-size: 2rem;
			margin-bottom: 1rem;
			opacity: 0.6;
		}

		p {
			margin: 0 0 0.5rem;
			font-weight: 500;
		}

		small {
			opacity: 0.7;
		}
	}

	.tools-panel-footer {
		padding: 0.875rem 1.25rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-top: 1px solid rgba(var(--color--border-rgb), 0.1);
		background: rgba(var(--color--primary-rgb), 0.02);

		.active-count {
			font-size: 0.8rem;
			color: var(--color--text-shade);
			font-weight: 500;
		}
	}

	@media (max-width: 768px) {
		.tools-panel {
			margin: 0.5rem;
			max-width: none;
			border-radius: 12px;
		}

		.tools-panel-header {
			padding: 1rem;
		}

		.tool-item {
			padding: 0.75rem 1rem;
		}

		.tool-description {
			margin-left: 2.75rem;
		}

		.tools-panel-footer {
			padding: 1rem;
			flex-direction: column;
			gap: 0.75rem;
		}
	}
</style>
