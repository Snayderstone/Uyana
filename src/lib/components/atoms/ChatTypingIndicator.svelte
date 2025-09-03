<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { scale, fly } from 'svelte/transition';

	export let isTyping = false;
	export let dots = 3;
	export let speed = 500; // milliseconds

	const dispatch = createEventDispatcher<{
		cancel: void;
	}>();

	let currentDots = 1;
	let interval: NodeJS.Timeout | null = null;

	$: if (isTyping) {
		startAnimation();
	} else {
		stopAnimation();
	}

	function startAnimation() {
		if (interval) clearInterval(interval);

		interval = setInterval(() => {
			currentDots = currentDots >= dots ? 1 : currentDots + 1;
		}, speed);
	}

	function stopAnimation() {
		if (interval) {
			clearInterval(interval);
			interval = null;
		}
		currentDots = 1;
	}

	function handleCancel() {
		dispatch('cancel');
	}
</script>

{#if isTyping}
	<div class="typing-indicator" transition:fly={{ y: 10, duration: 300 }}>
		<div class="typing-content">
			<div class="avatar">
				<div class="avatar-icon">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
						<path
							d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<circle
							cx="12"
							cy="7"
							r="4"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</div>
				<div class="pulse-ring" />
			</div>

			<div class="typing-text">
				<span class="typing-label">UYANA está escribiendo</span>
				<div class="dots">
					{#each Array(dots) as _, i}
						<span class="dot" class:active={i < currentDots} style="animation-delay: {i * 150}ms" />
					{/each}
				</div>
			</div>
		</div>

		<button
			class="cancel-button"
			on:click={handleCancel}
			title="Cancelar"
			transition:scale={{ duration: 200 }}
		>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none">
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
{/if}

<style lang="scss">
	.typing-indicator {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		margin: 0.5rem 0;
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--primary-rgb), 0.1);
		border-radius: 16px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		backdrop-filter: blur(10px);
	}

	.typing-content {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.avatar {
		position: relative;
		width: 36px;
		height: 36px;
		flex-shrink: 0;

		.avatar-icon {
			width: 100%;
			height: 100%;
			background: linear-gradient(135deg, var(--color--primary), var(--color--secondary));
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			color: white;
			position: relative;
			z-index: 2;
		}

		.pulse-ring {
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 100%;
			height: 100%;
			border: 2px solid var(--color--primary);
			border-radius: 50%;
			animation: pulse-ring 2s ease-out infinite;
			opacity: 0.3;
		}
	}

	.typing-text {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;

		.typing-label {
			font-size: 0.8rem;
			color: var(--color--text-shade);
			font-weight: 500;
		}
	}

	.dots {
		display: flex;
		gap: 0.25rem;
		align-items: center;

		.dot {
			width: 6px;
			height: 6px;
			border-radius: 50%;
			background-color: var(--color--text-shade);
			opacity: 0.3;
			transition: all 0.3s ease;

			&.active {
				opacity: 1;
				background-color: var(--color--primary);
				transform: scale(1.2);
			}
		}
	}

	.cancel-button {
		background: none;
		border: none;
		color: var(--color--text-shade);
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		opacity: 0.6;

		&:hover {
			opacity: 1;
			background-color: rgba(var(--color--callout-accent--error), 0.1);
			color: var(--color--callout-accent--error);
		}

		&:active {
			transform: scale(0.95);
		}
	}

	@keyframes pulse-ring {
		0% {
			transform: translate(-50%, -50%) scale(1);
			opacity: 0.3;
		}
		100% {
			transform: translate(-50%, -50%) scale(1.5);
			opacity: 0;
		}
	}
</style>
