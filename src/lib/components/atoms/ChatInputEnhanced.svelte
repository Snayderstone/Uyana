<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { fade, scale, fly } from 'svelte/transition';

	export let placeholder = 'Escribe tu mensaje...';
	export let disabled = false;
	export let maxHeight = 150;
	export let autoFocus = true;
	export let showToolsButton = true;
	export let availableTools: any[] = [];
	export let activeTools: Set<string> = new Set();

	let message = '';
	let textarea: HTMLTextAreaElement;
	let isFocused = false;
	let showToolsPanel = false;

	const dispatch = createEventDispatcher<{
		send: { message: string };
		command: { command: string; args: string[] };
		'tools-toggle': void;
		'toggle-tool': { toolName: string };
		'quick-actions': void;
	}>();
	onMount(() => {
		if (autoFocus && textarea && !disabled) {
			setTimeout(() => textarea.focus(), 100);
		}
	});

	function handleSubmit() {
		if (!message.trim() || disabled) return;

		if (message.trim().startsWith('/')) {
			const commandParts = message.trim().slice(1).split(' ');
			const command = commandParts[0];
			const args = commandParts.slice(1);

			dispatch('command', { command, args });
			message = '';
			adjustTextareaHeight();
			return;
		}

		dispatch('send', { message: message.trim() });
		message = '';
		adjustTextareaHeight();
	}

	function handleKeydown(event: KeyboardEvent) {
		// Accesos rápidos con Ctrl+K o Cmd+K
		if (event.key === 'k' && (event.ctrlKey || event.metaKey)) {
			event.preventDefault();
			dispatch('quick-actions');
			return;
		}

		// Enviar con Enter (sin Shift)
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSubmit();
		}
	}

	function adjustTextareaHeight() {
		if (!textarea) return;

		textarea.style.height = 'auto';
		const newHeight = Math.min(textarea.scrollHeight, maxHeight);
		textarea.style.height = `${newHeight}px`;
	}

	function toggleToolsPanel() {
		showToolsPanel = !showToolsPanel;
		dispatch('tools-toggle');
	}

	function handleToolToggle(toolName: string) {
		dispatch('toggle-tool', { toolName });
	}

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
			data: '💾'
		};
		return emojiMap[toolName] || '⚙️';
	}

	$: if (textarea && message !== undefined) {
		adjustTextareaHeight();
	}

	$: canSend = message.trim().length > 0 && !disabled;
</script>

<div class="enhanced-chat-input">
	<div class="input-container">
		<div class="input-wrapper" class:focused={isFocused} class:disabled>
			<!-- Botón de herramientas a la izquierda -->
			{#if showToolsButton && availableTools.length > 0}
				<button
					class="tools-button"
					class:active={activeTools.size > 0}
					on:click={toggleToolsPanel}
					title="Herramientas disponibles"
					type="button"
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
						<path
							d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
							stroke="currentColor"
							stroke-width="2"
						/>
					</svg>
					{#if activeTools.size > 0}
						<span class="tools-count">{activeTools.size}</span>
					{/if}
				</button>
			{/if}

			<!-- Campo de texto -->
			<textarea
				bind:this={textarea}
				bind:value={message}
				on:keydown={handleKeydown}
				on:input={adjustTextareaHeight}
				on:focus={() => {
					isFocused = true;
				}}
				on:blur={() => {
					isFocused = false;
				}}
				{placeholder}
				{disabled}
				rows="1"
				autocomplete="off"
				class="message-input"
				style="padding-left: {showToolsButton && availableTools.length > 0 ? '52px' : '20px'}"
			/>

			<!-- Botón de envío -->
			<button
				type="button"
				class="send-button"
				class:active={canSend}
				on:click={handleSubmit}
				disabled={!canSend}
				aria-label="Enviar mensaje"
			>
				{#if disabled}
					<!-- Spinner de carga -->
					<div class="spinner" transition:scale={{ duration: 200 }}>
						<svg width="20" height="20" viewBox="0 0 24 24">
							<circle
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="2"
								fill="none"
								stroke-dasharray="60"
								stroke-dashoffset="60"
							>
								<animate
									attributeName="stroke-dashoffset"
									values="60;0;60"
									dur="2s"
									repeatCount="indefinite"
								/>
							</circle>
						</svg>
					</div>
				{:else}
					<!-- Icono de enviar -->
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
						<path
							d="M7 11L12 6L17 11M12 18V7"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				{/if}
			</button>
		</div>

		<!-- Panel mini de herramientas -->
		{#if showToolsPanel && showToolsButton}
			<div class="tools-mini-panel" transition:fly={{ y: 5, duration: 150 }}>
				<div class="tools-grid">
					{#each availableTools.slice(0, 6) as tool}
						<label class="tool-mini-item" class:active={activeTools.has(tool.name)}>
							<input
								type="checkbox"
								checked={activeTools.has(tool.name)}
								on:change={() => handleToolToggle(tool.name)}
							/>
							<span class="tool-emoji">{getToolEmoji(tool.name)}</span>
							<span class="tool-mini-name">{tool.title || tool.name}</span>
						</label>
					{/each}
				</div>
				{#if availableTools.length > 6}
					<div class="tools-more">
						+{availableTools.length - 6} más
					</div>
				{/if}
			</div>
		{/if}

		<!-- Indicadores de estado -->
		<div class="input-footer" class:visible={message.length > 0 || isFocused}>
			<div class="char-counter" class:warning={message.length > 500}>
				{message.length}/1000
			</div>
			<div class="shortcuts-hint">
				Usa <kbd>/help</kbd> para comandos • <kbd>⌘K</kbd> para accesos rápidos
			</div>
		</div>
	</div>
</div>

<style lang="scss">
	@import '$lib/scss/breakpoints.scss';

	.enhanced-chat-input {
		width: 100%;
		padding: 1rem 2rem;
		max-width: 1100px;
		margin: 0 auto;
	}

	.input-container {
		position: relative;
	}

	.input-wrapper {
		position: relative;
		display: flex;
		align-items: flex-end;
		background: var(--color--card-background);
		border: 2px solid rgba(var(--color--border-rgb), 0.15);
		border-radius: 24px;
		transition: all 0.3s ease;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
		backdrop-filter: blur(10px);

		&.focused {
			border-color: var(--color--primary);
			box-shadow: 0 0 0 4px rgba(var(--color--primary-rgb), 0.1);
			transform: translateY(-1px);
		}

		&.disabled {
			opacity: 0.7;
			cursor: not-allowed;
			background: rgba(var(--color--border-rgb), 0.05);
		}

		&:hover:not(.disabled):not(.focused) {
			border-color: rgba(var(--color--border-rgb), 0.25);
			box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
		}
	}

	.message-input {
		flex: 1;
		width: 100%;
		min-height: 24px;
		max-height: 150px;
		padding: 14px 20px;
		padding-right: 64px; /* Solo espacio para botón de envío */
		background: transparent;
		color: var(--color--text);
		font-family: inherit;
		font-size: 1rem;
		line-height: 1.5;
		resize: none;
		border: none;
		outline: none;
		overflow-y: auto;

		&::placeholder {
			color: rgba(var(--color--text-rgb), 0.5);
		}

		&:disabled {
			cursor: not-allowed;
		}

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

	.send-button {
		position: absolute;
		right: 12px;
		bottom: 12px;
		width: 40px;
		height: 40px;
		border: none;
		border-radius: 20px;
		background: rgba(var(--color--text-rgb), 0.08);
		color: rgba(var(--color--text-rgb), 0.4);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;

		&:hover:not(:disabled) {
			background: rgba(var(--color--text-rgb), 0.12);
			color: rgba(var(--color--text-rgb), 0.6);
			transform: scale(1.05);
		}

		&.active {
			background: var(--color--primary);
			color: white;

			&:hover {
				background: rgba(var(--color--primary-rgb), 0.9);
				transform: scale(1.08);
			}
		}

		&:disabled {
			cursor: not-allowed;
			opacity: 0.5;
		}

		&:active:not(:disabled) {
			transform: scale(0.95);
		}

		.spinner {
			animation: spin 1s linear infinite;
		}
	}

	.tools-button {
		position: absolute;
		left: 12px;
		top: 50%;
		transform: translateY(-50%);
		width: 36px;
		height: 36px;
		border: none;
		border-radius: 18px;
		background: rgba(var(--color--text-rgb), 0.08);
		color: rgba(var(--color--text-rgb), 0.5);
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2;

		&:hover {
			background: rgba(var(--color--primary-rgb), 0.1);
			color: var(--color--primary);
			transform: translateY(-50%) scale(1.05);
		}

		&.active {
			background: rgba(var(--color--primary-rgb), 0.15);
			color: var(--color--primary);
		}

		.tools-count {
			position: absolute;
			top: -4px;
			right: -4px;
			width: 18px;
			height: 18px;
			background: var(--color--primary);
			color: white;
			border-radius: 9px;
			font-size: 10px;
			font-weight: 600;
			display: flex;
			align-items: center;
			justify-content: center;
			animation: pulse 2s infinite;
		}
	}

	.tools-mini-panel {
		position: absolute;
		bottom: calc(100% + 4px);
		left: 0;
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--border-rgb), 0.2);
		border-radius: 8px;
		backdrop-filter: blur(20px);
		padding: 8px;
		z-index: 1000;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
		width: max-content;
		max-width: min(80vw, 600px);
		min-width: 200px;

		.tools-grid {
			display: flex;
			flex-wrap: nowrap;
			gap: 6px;
			align-items: center;

			.tool-mini-item {
				display: flex;
				align-items: center;
				gap: 4px;
				padding: 4px 8px;
				border: 1px solid rgba(var(--color--border-rgb), 0.2);
				border-radius: 6px;
				cursor: pointer;
				transition: all 0.2s ease;
				background: rgba(var(--color--card-background));
				white-space: nowrap;
				font-size: 11px;

				&:hover {
					background: rgba(var(--color--primary-rgb), 0.08);
					border-color: rgba(var(--color--primary-rgb), 0.3);
				}

				&.active {
					background: rgba(var(--color--primary-rgb), 0.12);
					border-color: rgba(var(--color--primary-rgb), 0.4);
				}

				input {
					appearance: none;
					width: 12px;
					height: 12px;
					border: 1.5px solid rgba(var(--color--border-rgb), 0.3);
					border-radius: 2px;
					background: transparent;
					cursor: pointer;
					position: relative;
					transition: all 0.2s ease;
					flex-shrink: 0;

					&:checked {
						background: var(--color--primary);
						border-color: var(--color--primary);

						&::after {
							content: '✓';
							position: absolute;
							top: 50%;
							left: 50%;
							transform: translate(-50%, -50%);
							color: white;
							font-size: 8px;
							font-weight: bold;
						}
					}
				}

				.tool-emoji {
					font-size: 12px;
					flex-shrink: 0;
				}

				.tool-mini-name {
					font-size: 10px;
					font-weight: 500;
					color: var(--color--text);
					white-space: nowrap;
				}
			}
		}

		.tools-more {
			margin-left: 8px;
			font-size: 9px;
			color: rgba(var(--color--text-rgb), 0.5);
			padding: 4px 6px;
			background: rgba(var(--color--border-rgb), 0.1);
			border-radius: 4px;
			white-space: nowrap;
		}
	}

	.input-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0.75rem 0;
		opacity: 0;
		transform: translateY(-10px);
		transition: all 0.3s ease;

		&.visible {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.char-counter {
		font-size: 0.75rem;
		color: var(--color--text-shade);

		&.warning {
			color: var(--color--callout-accent--warning);
		}
	}

	.shortcuts-hint {
		font-size: 0.75rem;
		color: var(--color--text-shade);

		kbd {
			background: var(--color--code-inline-background);
			color: var(--color--text);
			padding: 2px 4px;
			border-radius: 3px;
			font-size: 0.7rem;
			font-family: inherit;
			border: 1px solid rgba(var(--color--border-rgb), 0.2);
		}
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes pulse {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.1);
		}
	}

	@include for-tablet-portrait-down {
		.enhanced-chat-input {
			padding: 0.75rem 1rem;
		}

		.input-wrapper {
			border-radius: 20px;
		}

		.message-input {
			padding: 12px 18px;
			padding-right: 60px;
			font-size: 0.95rem;
		}

		.send-button {
			width: 36px;
			height: 36px;
			right: 10px;
			bottom: 10px;
		}

		.tools-button {
			width: 32px;
			height: 32px;
			left: 10px;

			svg {
				width: 18px;
				height: 18px;
			}
		}

		.tools-mini-panel {
			position: fixed;
			bottom: calc(80px + 60px);
			left: 16px;
			right: auto;
			width: max-content;
			max-width: calc(100vw - 32px);
			min-width: 200px;
		}
	}

	@include for-phone-only {
		.enhanced-chat-input {
			padding: 0.75rem;
		}

		.input-wrapper {
			border-radius: 18px;
		}

		.message-input {
			padding: 10px 16px;
			padding-right: 56px;
			font-size: 0.9rem;
		}

		.send-button {
			width: 32px;
			height: 32px;
			right: 8px;
			bottom: 8px;

			svg {
				width: 18px;
				height: 18px;
			}
		}

		.tools-button {
			width: 28px;
			height: 28px;
			left: 8px;

			svg {
				width: 16px;
				height: 16px;
			}

			.tools-count {
				width: 16px;
				height: 16px;
				font-size: 9px;
			}
		}

		.tools-mini-panel {
			position: fixed;
			bottom: calc(70px + 60px);
			left: 12px;
			right: auto;
			width: max-content;
			max-width: calc(100vw - 24px);
			min-width: 180px;

			.tools-grid {
				flex-wrap: wrap;
			}
		}

		.shortcuts-hint {
			display: none; /* Ocultar en móvil */
		}
	}
</style>
