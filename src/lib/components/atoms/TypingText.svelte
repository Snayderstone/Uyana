<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createEventDispatcher } from 'svelte';

	export let text: string = '';
	export let speed: number = 30; // milisegundos por carácter
	export let startDelay: number = 100; // delay antes de comenzar
	export let autoStart: boolean = true;

	const dispatch = createEventDispatcher<{
		complete: void;
		start: void;
	}>();

	let displayedText = '';
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
			currentIndex++;

			typingInterval = setTimeout(typeNextCharacter, speed);
		} else {
			isTyping = false;
			dispatch('complete');
		}
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
	{@html displayedText.replace(/\n/g, '<br>')}
	{#if isTyping}
		<span class="cursor">|</span>
	{/if}
</span>

<style lang="scss">
	.typing-text {
		display: inline-block;
		position: relative;
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
