<script lang="ts">
	import { onMount, afterUpdate } from 'svelte';
	import { fly } from 'svelte/transition';
	import type { ChatMessage } from '$lib/stores/chatStore';
	import ChatMessageModern from '$lib/components/molecules/ChatMessageModern.svelte';
	import GlowPoint from '$lib/components/atoms/GlowPoint.svelte';

	export let messages: ChatMessage[] = [];
	export let showTimestamps = false;
	export let groupSimilarMessages = true;

	let messagesContainer: HTMLElement;
	let autoScroll = true;
	let showScrollToBottom = false;

	onMount(() => {
		scrollToBottom();
		// Observar el scroll para mostrar/ocultar el botón de scroll
		if (messagesContainer) {
			messagesContainer.addEventListener('scroll', handleScroll);
		}
	});

	afterUpdate(() => {
		if (autoScroll) {
			scrollToBottom();
		}
	});

	// Procesa los mensajes para agruparlos si son del mismo remitente
	$: processedMessages = groupSimilarMessages
		? groupMessages(messages)
		: messages.map((msg, index) => ({
				message: msg,
				showAvatar: true,
				showTimestamp: false,
				isLastAssistantMessage: isLastAssistantMsg(messages, index)
		  }));

	// Función para determinar si es el último mensaje del asistente
	function isLastAssistantMsg(msgs: ChatMessage[], currentIndex: number): boolean {
		const currentMsg = msgs[currentIndex];
		if (currentMsg.role !== 'assistant') return false;

		// Buscar si hay algún mensaje del asistente después de este
		for (let i = currentIndex + 1; i < msgs.length; i++) {
			if (msgs[i].role === 'assistant') {
				return false;
			}
		}
		return true;
	}

	// Función para agrupar mensajes del mismo remitente
	function groupMessages(msgs: ChatMessage[]) {
		const result = [];
		let lastRole = '';

		for (let i = 0; i < msgs.length; i++) {
			const showAvatar = msgs[i].role !== lastRole || i === 0;
			// Mostrar timestamp en el último mensaje de cada grupo o si es el último mensaje
			const showTimestamp =
				showTimestamps && (i === msgs.length - 1 || msgs[i + 1]?.role !== msgs[i].role);

			result.push({
				message: msgs[i],
				showAvatar,
				showTimestamp,
				isLastAssistantMessage: isLastAssistantMsg(msgs, i)
			});

			lastRole = msgs[i].role;
		}

		return result;
	}

	function scrollToBottom() {
		if (messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	}

	function handleScroll() {
		if (!messagesContainer) return;

		const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
		const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

		// Si está más de 100px del fondo, deshabilitar auto-scroll
		autoScroll = distanceFromBottom < 100;

		// Mostrar el botón de volver abajo si no está en auto-scroll
		showScrollToBottom = !autoScroll;
	}

	function handleSuggestion(message: string) {
		// Disparar evento personalizado para enviar la sugerencia
		const event = new CustomEvent('suggestion', {
			detail: { message },
			bubbles: true
		});
		messagesContainer?.dispatchEvent(event);
	}
</script>

<div class="messages-container" bind:this={messagesContainer}>
	{#if messages.length === 0}
		<div class="empty-state" in:fly={{ y: 20, duration: 300, delay: 200 }}>
			<div class="empty-icon">💬</div>
			<h3>¡Hola! Soy UYANA</h3>
			<p>¿En qué puedo ayudarte hoy?</p>

			<div class="suggestion-chips">
				<button class="suggestion-chip" on:click={() => handleSuggestion('¿Qué es UYANA?')}>
					¿Qué es UYANA?
				</button>
				<button
					class="suggestion-chip"
					on:click={() => handleSuggestion('Explícame sobre datos geoespaciales')}
				>
					Datos geoespaciales
				</button>
				<button class="suggestion-chip" on:click={() => handleSuggestion('¿Cómo puedes ayudarme?')}>
					¿Cómo me ayudas?
				</button>
			</div>
		</div>
	{:else}
		{#each processedMessages as { message, showAvatar, showTimestamp: showMessageTimestamp, isLastAssistantMessage } (message.id)}
			<ChatMessageModern
				{message}
				{showAvatar}
				showTimestamp={showMessageTimestamp}
				{isLastAssistantMessage}
			/>
		{/each}
	{/if}

	{#if showScrollToBottom}
		<button
			class="scroll-to-bottom"
			on:click={() => {
				autoScroll = true;
				scrollToBottom();
			}}
			transition:fly={{ y: 20, duration: 150 }}
		>
			<svg
				width="16"
				height="16"
				viewBox="0 0 16 16"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path d="M8 12L3 7L4.4 5.55L8 9.15L11.6 5.55L13 7L8 12Z" fill="currentColor" />
			</svg>
		</button>
	{/if}
</div>

<style lang="scss">
	@import '$lib/scss/breakpoints.scss';

	.messages-container {
		flex: 1;
		padding: 1rem 1rem 0.375rem;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		scroll-behavior: smooth;
		position: relative;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		height: 100%;
		padding: 2rem 1.5rem;
		opacity: 0.9;

		.empty-icon {
			font-size: 2.25rem;
			margin-bottom: 0.75rem;
			filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.08));
		}

		h3 {
			font-size: 1.25rem;
			margin: 0 0 0.375rem;
			color: var(--color--text);
			font-weight: 600;
		}

		p {
			color: var(--color--text-shade);
			font-size: 0.875rem;
			max-width: 380px;
			margin: 0 0 1.5rem;
			line-height: 1.5;
			opacity: 0.9;
		}
	}

	.suggestion-chips {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 0.75rem;

		.suggestion-chip {
			background-color: var(--color--card-background);
			color: var(--color--text);
			border: 1.5px solid rgba(var(--color--primary-rgb), 0.15);
			border-radius: 16px;
			padding: 0.5rem 0.875rem;
			font-size: 0.8rem;
			font-weight: 500;
			transition: all 0.2s ease;
			cursor: pointer;
			box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

			&:hover {
				background-color: rgba(var(--color--primary-rgb), 0.1);
				border-color: rgba(var(--color--primary-rgb), 0.4);
				transform: translateY(-2px);
				box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
			}

			&:active {
				transform: translateY(0);
			}
		}
	}

	.scroll-to-bottom {
		position: absolute;
		bottom: 20px;
		right: 20px;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background-color: var(--color--card-background);
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color--text-shade);
		cursor: pointer;
		transition: all 0.2s ease;
		z-index: 10;

		&:hover {
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
			color: var(--color--primary);
		}
	}

	@include for-tablet-portrait-down {
		.messages-container {
			padding: 1.25rem 1.25rem 0.5rem;
		}
	}

	@include for-phone-only {
		.messages-container {
			padding: 1rem 1rem 0.5rem;
		}

		.empty-state {
			padding: 1.5rem 1rem;

			.empty-icon {
				font-size: 2.2rem;
			}

			h3 {
				font-size: 1.1rem;
			}

			p {
				font-size: 0.9rem;
			}
		}

		.suggestion-chips .suggestion-chip {
			padding: 6px 12px;
			font-size: 0.8rem;
		}
	}
</style>
