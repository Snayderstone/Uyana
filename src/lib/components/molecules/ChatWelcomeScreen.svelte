<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	export let title = '';
	export let subtitle = '';
	export let suggestions: string[] = [];
	export let icon = '💬';
	export let animated = true;

	const dispatch = createEventDispatcher<{
		suggestion: { message: string };
	}>();

	function handleSuggestion(suggestion: string) {
		dispatch('suggestion', { message: suggestion });
	}
</script>

<div class="welcome-screen">
	<div class="welcome-content" class:animated>
		<div class="welcome-icon" in:fly={{ y: 20, duration: 600, delay: 200 }}>
			{icon}
		</div>

		<div class="welcome-text" in:fly={{ y: 20, duration: 600, delay: 400 }}>
			<h2>{title}</h2>
			{#if subtitle}
				<p class="subtitle">{subtitle}</p>
			{/if}
		</div>

		{#if suggestions.length > 0}
			<div class="suggestions" in:fly={{ y: 20, duration: 600, delay: 600 }}>
				<p class="suggestions-label">Comienza con una de estas preguntas:</p>
				<div class="suggestion-grid">
					{#each suggestions as suggestion, index}
						<button
							class="suggestion-card"
							on:click={() => handleSuggestion(suggestion)}
							in:fly={{ y: 20, duration: 400, delay: 700 + index * 100 }}
						>
							<span class="suggestion-text">{suggestion}</span>
							<svg class="suggestion-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none">
								<path
									d="M7 17L17 7M17 7H7M17 7V17"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<div class="welcome-footer" in:fade={{ duration: 400, delay: 800 }}>
			<p class="footer-text">
				Escribe tu pregunta o usa <code>/help</code> para ver comandos disponibles
			</p>
		</div>
	</div>
</div>

<style lang="scss">
	@import '$lib/scss/breakpoints.scss';

	.welcome-screen {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100%;
		padding: 1rem;
		text-align: center;
	}

	.welcome-content {
		max-width: 600px;
		width: 100%;

		&.animated {
			animation: breathe 8s ease-in-out infinite;
		}
	}

	.welcome-icon {
		font-size: 2.5rem;
		margin-bottom: 1rem;
		filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1));
		line-height: 1;

		@include for-phone-only {
			font-size: 2rem;
			margin-bottom: 0.75rem;
		}
	}

	.welcome-text {
		margin-bottom: 1.5rem;

		h2 {
			font-size: 1.75rem;
			font-weight: 700;
			color: var(--color--text);
			margin: 0 0 0.5rem;
			background: linear-gradient(135deg, var(--color--primary), var(--color--secondary));
			background-clip: text;
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			line-height: 1.2;

			@include for-phone-only {
				font-size: 1.5rem;
			}
		}

		.subtitle {
			font-size: 0.95rem;
			color: var(--color--text-shade);
			margin: 0;
			line-height: 1.4;

			@include for-phone-only {
				font-size: 0.9rem;
			}
		}
	}

	.suggestions {
		margin-bottom: 1.5rem;

		.suggestions-label {
			font-size: 0.9rem;
			color: var(--color--text-shade);
			margin-bottom: 1rem;
			font-weight: 500;
		}
	}

	.suggestion-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 0.75rem;

		@include for-tablet-portrait-up {
			grid-template-columns: repeat(2, 1fr);
		}

		@include for-phone-only {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}
	}

	.suggestion-card {
		background: linear-gradient(
			135deg,
			var(--color--card-background) 0%,
			rgba(var(--color--primary-rgb), 0.02) 100%
		);
		border: 2px solid rgba(var(--color--primary-rgb), 0.12);
		border-radius: 12px;
		padding: 1rem 1.25rem;
		cursor: pointer;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		display: flex;
		align-items: center;
		justify-content: space-between;
		text-align: left;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02);
		position: relative;
		overflow: hidden;

		&::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			height: 3px;
			background: linear-gradient(90deg, var(--color--primary), var(--color--secondary));
			opacity: 0;
			transition: opacity 0.3s ease;
		}

		&:hover {
			border-color: rgba(var(--color--primary-rgb), 0.4);
			transform: translateY(-2px) scale(1.01);
			box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(var(--color--primary-rgb), 0.1);

			&::before {
				opacity: 1;
			}

			.suggestion-arrow {
				transform: translate(4px, -4px) rotate(5deg);
				color: var(--color--secondary);
			}

			.suggestion-text {
				color: var(--color--primary);
			}
		}

		&:active {
			transform: translateY(-1px) scale(1.005);
		}

		.suggestion-text {
			font-size: 0.95rem;
			color: var(--color--text);
			font-weight: 600;
			line-height: 1.4;
			flex: 1;
			transition: color 0.3s ease;
		}

		.suggestion-arrow {
			color: var(--color--primary);
			transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
			flex-shrink: 0;
			margin-left: 1rem;
			opacity: 0.8;
			width: 16px;
			height: 16px;
		}

		@include for-phone-only {
			padding: 1rem 1.25rem;
			border-radius: 12px;

			.suggestion-text {
				font-size: 0.9rem;
			}

			.suggestion-arrow {
				width: 14px;
				height: 14px;
				margin-left: 0.75rem;
			}
		}
	}

	.welcome-footer {
		margin-top: 1rem;

		.footer-text {
			font-size: 0.8rem;
			color: var(--color--text-shade);
			margin: 0;
			opacity: 0.85;
			font-weight: 500;

			code {
				background: linear-gradient(
					135deg,
					rgba(var(--color--primary-rgb), 0.1),
					rgba(var(--color--secondary-rgb), 0.1)
				);
				color: var(--color--primary);
				padding: 2px 6px;
				border-radius: 4px;
				font-size: 0.8rem;
				font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New',
					monospace;
				font-weight: 600;
				border: 1px solid rgba(var(--color--primary-rgb), 0.2);
			}
		}
	}

	@keyframes breathe {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.02);
		}
	}
</style>
