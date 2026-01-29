<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createEventDispatcher } from 'svelte';

	export let text: string = '';
	export let speed: number = 30; // milisegundos por carácter
	export let startDelay: number = 100; // delay antes de comenzar
	export let autoStart: boolean = true;
	export let applyMarkdown: boolean = true; // Aplicar formato markdown en tiempo real

	const dispatch = createEventDispatcher<{
		complete: void;
		start: void;
	}>();

	let displayedText = '';
	let formattedText = '';
	let currentIndex = 0;
	let isTyping = false;
	let typingInterval: NodeJS.Timeout | null = null;
	let startTimeout: NodeJS.Timeout | null = null;

	$: if (text && autoStart && !isTyping && currentIndex === 0) {
		startTyping();
	}

	function startTyping() {
		if (isTyping || !text) return;

		startTimeout = setTimeout(() => {
			isTyping = true;
			dispatch('start');
			typeNextCharacter();
		}, startDelay);
	}

	function typeNextCharacter() {
		if (currentIndex < text.length) {
			displayedText = text.substring(0, currentIndex + 1);
			// Aplicar formato markdown en tiempo real si está habilitado
			if (applyMarkdown) {
				formattedText = applyQuickMarkdown(displayedText);
			} else {
				formattedText = displayedText;
			}
			currentIndex++;

			typingInterval = setTimeout(typeNextCharacter, speed);
		} else {
			isTyping = false;
			dispatch('complete');
		}
	}

	// Aplicar formato markdown rápido (sin procesar bloques complejos durante typing)
	function applyQuickMarkdown(content: string): string {
		let formatted = content;
		const backtick = String.fromCharCode(96);

		// 1. Código inline
		const inlineCodeRegex = new RegExp(backtick + '([^' + backtick + ']+)' + backtick, 'g');
		formatted = formatted.replace(inlineCodeRegex, '<code class="inline-code">$1</code>');

		// 2. Negrita **texto**
		const boldRegex = new RegExp('\\*\\*(.+?)\\*\\*', 'g');
		formatted = formatted.replace(boldRegex, '<strong>$1</strong>');

		// 3. Cursiva *texto* (evitar conflicto con listas)
		const italicRegex = new RegExp('\\*([^*\\n]+)\\*', 'g');
		formatted = formatted.replace(italicRegex, '<em>$1</em>');

		// 4. Listas simples (solo visual básico durante typing)
		formatted = formatted.replace(/^(\d+)\.\s+/gm, '<span class="list-marker">$1. </span>');
		formatted = formatted.replace(/^[-*]\s+/gm, '<span class="list-marker">• </span>');

		return formatted;
	}

	function stopTyping() {
		if (typingInterval) {
			clearTimeout(typingInterval);
			typingInterval = null;
		}
		if (startTimeout) {
			clearTimeout(startTimeout);
			startTimeout = null;
		}
		isTyping = false;
		displayedText = text;
		currentIndex = text.length;
		dispatch('complete');
	}

	function reset() {
		stopTyping();
		displayedText = '';
		currentIndex = 0;
	}

	onDestroy(() => {
		if (typingInterval) clearTimeout(typingInterval);
		if (startTimeout) clearTimeout(startTimeout);
	});

	// Exponer métodos públicos
	export { startTyping, stopTyping, reset };
</script>

<span class="typing-text">
	{@html formattedText.replace(/\n/g, '<br>')}
	{#if isTyping}
		<span class="cursor">|</span>
	{/if}
</span>

<style lang="scss">
	.typing-text {
		display: inline-block;
		position: relative;

		:global(.list-marker) {
			color: var(--color--primary);
			font-weight: 600;
		}

		:global(.inline-code) {
			background: rgba(var(--color--primary-rgb), 0.1);
			color: var(--color--primary);
			padding: 2px 6px;
			border-radius: 4px;
			font-family: 'SF Mono', 'Monaco', 'Consolas', 'Courier New', monospace;
			font-size: 11px;
			font-weight: 500;
			border: 1px solid rgba(var(--color--primary-rgb), 0.2);
		}

		:global(strong) {
			font-weight: 600;
			color: var(--color--text-primary);
		}

		:global(em) {
			font-style: italic;
			color: var(--color--text-secondary);
		}
	}

	.cursor {
		display: inline-block;
		margin-left: 2px;
		animation: blink 0.8s infinite;
		color: var(--color--primary);
		font-weight: 600;
	}

	@keyframes blink {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0;
		}
	}
</style>
