<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	export let title = '';
	export let subtitle = '';
	export let icon = '💬';
	export let animated = true;

	const dispatch = createEventDispatcher<{
		suggestion: { message: string };
	}>();

	// Sugerencias dinámicas basadas en estadísticas reales de Uyana
	const suggestions = [
		'¿Qué instituciones colaboradoras tienen más proyectos?',
		'¿Cuántos proyectos hay en estado aprobado vs en ejecución?'
	];

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
		font-size: 1.5rem;
		margin-bottom: 0.5rem;
		filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1));
		line-height: 1;

		@include for-phone-only {
			font-size: 1.25rem;
			margin-bottom: 0.375rem;
		}
	}

	.welcome-text {
		margin-bottom: 1rem;

		h2 {
			font-size: 1.125rem;
			font-weight: 700;
			color: var(--color--text);
			margin: 0 0 0.25rem;
			background: linear-gradient(135deg, var(--color--primary), var(--color--secondary));
			background-clip: text;
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			line-height: 1.2;

			@include for-phone-only {
				font-size: 1rem;
			}
		}

		.subtitle {
			font-size: 0.75rem;
			color: var(--color--text-shade);
			margin: 0;
			line-height: 1.3;
			opacity: 0.85;

			@include for-phone-only {
				font-size: 0.7rem;
			}
		}
	}

	.suggestions {
		margin-bottom: 1rem;

		.suggestions-label {
			font-size: 0.7rem;
			color: var(--color--text-shade);
			margin-bottom: 0.5rem;
			font-weight: 500;
			opacity: 0.8;
		}
	}

	.suggestion-grid {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-width: 480px;
		margin: 0 auto;
	}

	.suggestion-card {
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--border-rgb), 0.15);
		border-radius: 6px;
		padding: 0.5rem 0.625rem;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: space-between;
		text-align: left;
		width: 100%;

		&:hover {
			background: rgba(var(--color--primary-rgb), 0.05);
			border-color: rgba(var(--color--primary-rgb), 0.25);

			.suggestion-arrow {
				transform: translateX(2px);
			}
		}

		&:active {
			transform: scale(0.98);
		}

		.suggestion-text {
			font-size: 0.7rem;
			color: var(--color--text);
			font-weight: 500;
			line-height: 1.25;
			flex: 1;
		}

		.suggestion-arrow {
			color: var(--color--text-shade);
			transition: transform 0.2s ease;
			flex-shrink: 0;
			margin-left: 0.375rem;
			opacity: 0.6;
			width: 10px;
			height: 10px;
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
