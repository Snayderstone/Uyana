<script lang="ts">
	import { onMount, afterUpdate } from 'svelte';
	import { fly } from 'svelte/transition';
	import type { ChatMessage } from '$lib/stores/chatStore';
	import ChatMessageModern from '$lib/components/molecules/ChatMessageModern.svelte';

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
</script>

<div class="messages-container" bind:this={messagesContainer}>
	{#each processedMessages as { message, showAvatar, showTimestamp: showMessageTimestamp, isLastAssistantMessage } (message.id)}
		<ChatMessageModern
			{message}
			{showAvatar}
			showTimestamp={showMessageTimestamp}
			{isLastAssistantMessage}
		/>
	{/each}

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
	}
</style>
