<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import type { ChatMessage } from '$lib/stores/chatStore';
	import Sparkles from '$lib/components/atoms/Sparkles.svelte';

	export let message: ChatMessage;
	export let showTimestamp = false;
	export let showAvatar = true;

	let isVisible = false;

	const roleConfig = {
		user: {
			avatar: {
				bg: 'linear-gradient(135deg, #9C27B0, #673AB7)',
				icon: '👤'
			},
			bubble: {
				bg: 'linear-gradient(135deg, rgba(156, 39, 176, 0.15), rgba(103, 58, 183, 0.08))',
				border: '1px solid rgba(156, 39, 176, 0.4)',
				radius: '20px 20px 6px 20px'
			}
		},
		assistant: {
			avatar: {
				bg: 'linear-gradient(135deg, #FF6347, #FF4500)',
				icon: '🤖'
			},
			bubble: {
				bg: 'linear-gradient(135deg, rgba(255, 99, 71, 0.12), rgba(255, 69, 0, 0.06))',
				border: '1px solid rgba(255, 99, 71, 0.3)',
				radius: '20px 20px 20px 6px'
			}
		},
		tool: {
			avatar: { bg: 'linear-gradient(135deg, #9C27B0, #673AB7)', icon: '🔧' },
			bubble: {
				bg: 'linear-gradient(135deg, rgba(156, 39, 176, 0.05), rgba(103, 58, 183, 0.05))',
				border: '1px solid rgba(156, 39, 176, 0.2)',
				radius: '20px 20px 20px 6px'
			}
		},
		system: {
			avatar: { bg: 'linear-gradient(135deg, #607D8B, #455A64)', icon: '⚙️' },
			bubble: {
				bg: 'linear-gradient(135deg, rgba(96, 125, 139, 0.05), rgba(69, 90, 100, 0.05))',
				border: '1px solid rgba(96, 125, 139, 0.2)',
				radius: '20px 20px 20px 6px'
			}
		}
	};

	$: config = roleConfig[message.role] || roleConfig.assistant;
	$: formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
		hour: '2-digit',
		minute: '2-digit'
	});
	$: formattedContent = formatMessage(message.content);

	onMount(() => {
		setTimeout(() => (isVisible = true), 100);
	});

	function formatMessage(content: string): string {
		return content.replace(/\n/g, '<br>');
	}

	function copyMessage() {
		navigator.clipboard.writeText(message.content);
	}
</script>

<div class="message-container {message.role}" in:fly={{ y: 20, duration: 300, delay: 100 }}>
	{#if showAvatar}
		<div class="avatar" style="background: {config.avatar.bg};">
			{#if message.role === 'assistant'}
				<div class="assistant-avatar">
					<span class="avatar-icon">✨</span>
					<Sparkles color="primary">
						<span class="sparkle-overlay" />
					</Sparkles>
				</div>
			{:else}
				<span class="avatar-icon">{config.avatar.icon}</span>
			{/if}
		</div>
	{/if}

	<div class="message-content">
		<div
			class="message-bubble"
			style="
			background: {config.bubble.bg};
			border: {config.bubble.border};
			border-radius: {config.bubble.radius};
		"
		>
			<div class="content" class:visible={isVisible}>
				{@html formattedContent}
			</div>

			{#if message.role === 'user' || message.role === 'assistant'}
				<div class="message-actions">
					<button class="action-button" on:click={copyMessage} title="Copiar mensaje">
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
						>
							<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
							<path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
						</svg>
					</button>
				</div>
			{/if}
		</div>

		{#if showTimestamp}
			<div class="timestamp">{formattedTime}</div>
		{/if}
	</div>
</div>

<style lang="scss">
	.message-container {
		display: flex;
		gap: 12px;
		margin-bottom: 16px;
		align-items: flex-start;
		opacity: 0;
		animation: fadeInUp 0.3s ease-out forwards;

		&.user {
			flex-direction: row-reverse;
			.message-bubble {
				margin-left: auto;
			}
		}
	}

	.avatar {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s ease;
		position: relative;

		&:hover {
			transform: scale(1.05);
		}

		.avatar-icon {
			font-size: 18px;
			color: white;
			z-index: 2;
			position: relative;
		}

		.assistant-avatar {
			width: 100%;
			height: 100%;
			display: flex;
			align-items: center;
			justify-content: center;
			position: relative;

			.avatar-icon {
				font-size: 18px;
				color: white;
				z-index: 3;
				position: relative;
			}

			.sparkle-overlay {
				position: absolute;
				width: 100%;
				height: 100%;
				z-index: 1;
			}
		}
	}

	.message-content {
		max-width: calc(100% - 48px);
		flex: 1;
		min-width: 0;
	}

	.message-bubble {
		padding: 16px 20px;
		position: relative;
		backdrop-filter: blur(10px);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05);

		&:hover {
			transform: translateY(-2px);
			box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08);
			.message-actions {
				opacity: 1;
				visibility: visible;
			}
		}
	}

	/* Estilos específicos para mensajes de usuario */
	.message-container.user {
		.message-bubble {
			box-shadow: 0 2px 8px rgba(156, 39, 176, 0.15), 0 1px 3px rgba(103, 58, 183, 0.1);

			&:hover {
				box-shadow: 0 8px 24px rgba(156, 39, 176, 0.2), 0 4px 16px rgba(103, 58, 183, 0.15);
			}
		}
	}

	/* Estilos específicos para mensajes del asistente */
	.message-container.assistant {
		.message-bubble {
			box-shadow: 0 2px 8px rgba(255, 99, 71, 0.12), 0 1px 3px rgba(255, 69, 0, 0.08);

			&:hover {
				box-shadow: 0 8px 24px rgba(255, 99, 71, 0.18), 0 4px 16px rgba(255, 69, 0, 0.12);
			}
		}
	}

	.content {
		line-height: 1.6;
		opacity: 0;
		transform: translateY(10px);
		transition: all 0.3s ease;
		color: var(--color--text);

		&.visible {
			opacity: 1;
			transform: translateY(0);
		}

		:global(h1) {
			font-size: 1.5em;
			font-weight: 600;
			margin: 0 0 12px 0;
			color: var(--color--primary);
		}
		:global(h2) {
			font-size: 1.3em;
			font-weight: 600;
			margin: 16px 0 8px 0;
			color: var(--color--primary);
		}
		:global(h3) {
			font-size: 1.1em;
			font-weight: 600;
			margin: 12px 0 6px 0;
			color: var(--color--primary);
		}
		:global(strong) {
			font-weight: 600;
			color: var(--color--text-primary);
		}
		:global(em) {
			font-style: italic;
			color: var(--color--text-secondary);
		}

		:global(.inline-code) {
			background: rgba(var(--color--primary-rgb), 0.1);
			color: var(--color--primary);
			padding: 2px 6px;
			border-radius: 4px;
			font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
			font-size: 0.9em;
			border: 1px solid rgba(var(--color--primary-rgb), 0.2);
		}

		:global(.code-block) {
			background: var(--color--surface);
			border: 1px solid rgba(var(--color--border-rgb), 0.1);
			border-radius: 8px;
			margin: 12px 0;
			overflow: hidden;

			:global(.code-header) {
				background: rgba(var(--color--primary-rgb), 0.1);
				padding: 8px 16px;
				font-size: 0.85em;
				font-weight: 500;
				color: var(--color--primary);
				border-bottom: 1px solid rgba(var(--color--border-rgb), 0.1);
			}

			:global(pre) {
				margin: 0;
				padding: 16px;
				overflow-x: auto;

				:global(code) {
					font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
					font-size: 0.9em;
					line-height: 1.5;
					color: var(--color--text-primary);
				}
			}
		}
	}

	/* Estilo específico del contenido para mensajes de usuario */
	.message-container.user .content {
		color: var(--color--text);

		:global(strong) {
			color: #7b1fa2;
		}

		:global(.inline-code) {
			background: rgba(156, 39, 176, 0.15);
			color: #7b1fa2;
			border: 1px solid rgba(156, 39, 176, 0.3);
		}
	}

	.message-actions {
		position: absolute;
		top: 8px;
		right: 8px;
		opacity: 0;
		visibility: hidden;
		transition: all 0.2s ease;
		display: flex;
		gap: 4px;
	}

	.action-button {
		background: rgba(var(--color--surface-rgb), 0.9);
		border: 1px solid rgba(var(--color--border-rgb), 0.2);
		border-radius: 6px;
		padding: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
		color: var(--color--text-secondary);
		backdrop-filter: blur(10px);

		&:hover {
			background: rgba(var(--color--surface-rgb), 1);
			color: var(--color--text-primary);
			transform: scale(1.05);
		}

		&:active {
			transform: scale(0.95);
		}
	}

	.timestamp {
		font-size: 0.75em;
		color: var(--color--text-tertiary);
		margin-top: 6px;
		text-align: right;
	}

	.user .timestamp {
		text-align: left;
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 768px) {
		.message-container {
			gap: 8px;
			margin-bottom: 12px;
		}
		.avatar {
			width: 32px;
			height: 32px;
			.avatar-icon {
				font-size: 16px;
			}
		}
		.message-content {
			max-width: calc(100% - 40px);
		}
		.message-bubble {
			padding: 12px 16px;
		}
		.message-actions {
			position: relative;
			top: auto;
			right: auto;
			opacity: 1;
			visibility: visible;
			margin-top: 8px;
			justify-content: flex-end;
		}
	}
</style>
