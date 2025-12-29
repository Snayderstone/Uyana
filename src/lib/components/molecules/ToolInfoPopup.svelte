<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import Button from '$lib/components/atoms/Button.svelte';

	// Props
	export let isOpen = false;
	export let tool: any = null;

	const dispatch = createEventDispatcher<{
		close: void;
		activateTool: { toolName: string };
		useQuestion: { question: string };
	}>();

	function handleClose() {
		dispatch('close');
	}

	function handleActivateTool() {
		if (tool) {
			dispatch('activateTool', { toolName: tool.name });
			handleClose();
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleClose();
		}
	}
</script>

{#if isOpen && tool}
	<!-- Backdrop -->
	<div
		class="tool-info-backdrop"
		on:click={handleBackdropClick}
		role="button"
		tabindex="-1"
		on:keydown={(e) => e.key === 'Escape' && handleClose()}
		transition:fade={{ duration: 200 }}
	>
		<!-- Panel de información de la herramienta -->
		<div class="tool-info-panel" transition:fly={{ y: 20, duration: 300 }}>
			<div class="tool-info-header">
				<h3>
					{#if tool.metadata?.helpInfo?.title}
						{tool.metadata.helpInfo.title}
					{:else}
						{tool.title || tool.name}
					{/if}
				</h3>
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

			<div class="tool-info-content">
				{#if tool.metadata?.helpInfo?.description}
					<div class="info-section">
						<p class="info-description">{tool.metadata.helpInfo.description}</p>
					</div>
				{:else}
					<div class="info-section">
						<p class="info-description">{tool.description}</p>
					</div>
				{/if}

				{#if tool.metadata?.helpInfo?.howToUse}
					<div class="info-section">
						<h4>📝 Cómo usar esta herramienta</h4>
						<ul class="info-list">
							{#each tool.metadata.helpInfo.howToUse as step}
								<li>{step}</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if tool.metadata?.helpInfo?.suggestedQuestions}
					<div class="info-section">
						<h4>❓ Preguntas sugeridas</h4>
						<ul class="info-list questions">
							{#each tool.metadata.helpInfo.suggestedQuestions as question}
								<li>
									<button
										class="question-button"
										on:click={() => {
											dispatch('useQuestion', { question });
											handleClose();
										}}
									>
										{question}
									</button>
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if tool.metadata?.helpInfo?.tips}
					<div class="info-section">
						<h4>💡 Consejos</h4>
						<ul class="info-list tips">
							{#each tool.metadata.helpInfo.tips as tip}
								<li>{tip}</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if tool.metadata?.limitations}
					<div class="info-section">
						<h4>⚠️ Limitaciones</h4>
						<ul class="info-list limitations">
							{#each tool.metadata.limitations as limitation}
								<li>{limitation}</li>
							{/each}
						</ul>
					</div>
				{/if}

				<div class="info-metadata">
					{#if tool.metadata?.version}
						<span class="meta-item">Versión: {tool.metadata.version}</span>
					{/if}
					{#if tool.metadata?.author}
						<span class="meta-item">Autor: {tool.metadata.author}</span>
					{/if}
					{#if tool.category}
						<span class="meta-item">Categoría: {tool.category}</span>
					{/if}
				</div>
			</div>

			<div class="tool-info-footer">
				<Button color="secondary" style="clear" size="small" on:click={handleClose}>Cerrar</Button>
				<Button color="primary" style="solid" size="small" on:click={handleActivateTool}
					>Activar herramienta</Button
				>
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	.tool-info-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1100;
		padding: 1rem;
		backdrop-filter: blur(4px);
	}

	.tool-info-panel {
		background: var(--color--card-background);
		border-radius: 16px;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
		width: 100%;
		max-width: 600px;
		max-height: 85vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		border: 1px solid rgba(var(--color--border-rgb), 0.1);
	}

	.tool-info-header {
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

	.tool-info-content {
		flex: 1;
		padding: 1.5rem;
		overflow-y: auto;
		max-height: 500px;

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

	.info-section {
		margin-bottom: 1.5rem;

		&:last-of-type {
			margin-bottom: 0;
		}

		h4 {
			font-size: 0.875rem;
			margin: 0 0 0.625rem;
			color: var(--color--primary);
			font-weight: 600;
		}

		.info-description {
			font-size: 0.85rem;
			line-height: 1.4;
			color: var(--color--text);
			margin: 0;
		}
	}

	.info-list {
		list-style-type: none;
		padding: 0;
		margin: 0;

		li {
			font-size: 0.8rem;
			margin-bottom: 0.5rem;
			color: var(--color--text);
			line-height: 1.4;
			position: relative;
			padding-left: 0.5rem;

			&:before {
				content: '•';
				position: absolute;
				left: 0;
				color: var(--color--primary);
			}
		}

		&.questions {
			.question-button {
				background: none;
				border: none;
				padding: 0;
				font-size: 0.9rem;
				color: var(--color--primary);
				text-align: left;
				cursor: pointer;
				font-family: inherit;
				transition: color 0.2s ease;
				text-decoration: underline;
				text-decoration-thickness: 1px;
				text-decoration-color: rgba(var(--color--primary-rgb), 0.3);
				text-underline-offset: 2px;

				&:hover {
					color: var(--color--primary-dark);
					text-decoration-color: var(--color--primary);
				}
			}
		}

		&.tips {
			li {
				color: var(--color--text-shade);
			}
		}

		&.limitations {
			li {
				color: var(--color--text-shade);
				font-style: italic;
			}
		}
	}

	.info-metadata {
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(var(--color--border-rgb), 0.1);
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;

		.meta-item {
			font-size: 0.8rem;
			color: var(--color--text-shade);
			background: rgba(var(--color--border-rgb), 0.1);
			padding: 0.25rem 0.5rem;
			border-radius: 4px;
			font-weight: 500;
		}
	}

	.tool-info-footer {
		padding: 1rem 1.5rem;
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 0.75rem;
		border-top: 1px solid rgba(var(--color--border-rgb), 0.1);
		background: rgba(var(--color--primary-rgb), 0.02);
	}

	@media (max-width: 768px) {
		.tool-info-panel {
			margin: 0.5rem;
			max-width: none;
			border-radius: 12px;
			max-height: 80vh;
		}

		.tool-info-header,
		.tool-info-content,
		.tool-info-footer {
			padding: 1rem;
		}

		.tool-info-content {
			max-height: 60vh;
		}

		.info-section {
			margin-bottom: 1rem;

			h4 {
				font-size: 0.95rem;
			}

			.info-description {
				font-size: 0.9rem;
			}
		}

		.info-list li {
			font-size: 0.85rem;
		}
	}
</style>
