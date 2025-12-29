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

	function handleToolToggle(toolName: string) {
		dispatch('toggle-tool', { toolName });
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
					on:click={() => dispatch('tools-toggle')}
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

		<!-- Contador compacto -->
		{#if message.length > 0}
			<div
				class="char-counter"
				class:warning={message.length > 800}
				transition:fade={{ duration: 150 }}
			>
				{message.length}
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	@import '$lib/scss/breakpoints.scss';

	.enhanced-chat-input {
		width: 100%;
		padding: 0.75rem 1rem;
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
		border: 1.5px solid rgba(var(--color--border-rgb), 0.12);
		border-radius: 16px;
		transition: all 0.25s ease;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
		backdrop-filter: blur(10px);

		&.focused {
			border-color: var(--color--primary);
			box-shadow: 0 0 0 3px rgba(var(--color--primary-rgb), 0.08);
			transform: translateY(-0.5px);
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
		min-height: 20px;
		max-height: 120px;
		padding: 0.625rem 0.875rem;
		padding-right: 52px; /* Solo espacio para botón de envío */
		background: transparent;
		color: var(--color--text);
		font-family: inherit;
		font-size: 12px;
		line-height: 1.4;
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
		right: 8px;
		bottom: 8px;
		width: 34px;
		height: 34px;
		border: none;
		border-radius: 17px;
		background: rgba(var(--color--text-rgb), 0.06);
		color: rgba(var(--color--text-rgb), 0.4);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.25s ease;

		&:hover:not(:disabled) {
			background: rgba(var(--color--text-rgb), 0.1);
			color: rgba(var(--color--text-rgb), 0.6);
			transform: scale(1.05);
		}

		&.active {
			background: var(--color--primary);
			color: white;

			&:hover {
				background: rgba(var(--color--primary-rgb), 0.9);
				transform: scale(1.06);
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
		left: 8px;
		top: 50%;
		transform: translateY(-50%);
		width: 30px;
		height: 30px;
		border: none;
		border-radius: 15px;
		background: rgba(var(--color--text-rgb), 0.06);
		color: rgba(var(--color--text-rgb), 0.5);
		cursor: pointer;
		transition: all 0.25s ease;
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
			background: rgba(var(--color--primary-rgb), 0.12);
			color: var(--color--primary);
		}

		.tools-count {
			position: absolute;
			top: -3px;
			right: -3px;
			width: 16px;
			height: 16px;
			background: var(--color--primary);
			color: white;
			border-radius: 8px;
			font-size: 12px;
			font-weight: 600;
			display: flex;
			align-items: center;
			justify-content: center;
		}
	}

	.char-counter {
		position: absolute;
		bottom: -20px;
		right: 8px;
		font-size: 12px;
		color: var(--color--text-shade);
		opacity: 0.7;
		font-weight: 500;

		&.warning {
			color: var(--color--callout-accent--warning);
			opacity: 1;
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
			font-size: 12px;
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
			font-size: 12px;
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
				font-size: 12px;
			}
		}
	}
</style>
