<script lang="ts">
	import { onMount } from 'svelte';
	import ChatInterfaceModern from '$lib/components/organisms/ChatInterfaceModern.svelte';

	// Estado simple de carga
	let isReady = false;

	onMount(() => {
		// Forzar modo claro
		document.documentElement.setAttribute('data-theme', 'light');

		// Pequeño retraso para asegurar que todo esté listo
		setTimeout(() => {
			isReady = true;
		}, 100);
	});
</script>

<svelte:head>
	<title>UYANA Chat - Asistente de Investigación Geoespacial</title>
	<meta
		name="description"
		content="Chat inteligente con UYANA, tu asistente especializado en investigación geoespacial, datos cartográficos y análisis espacial de la Universidad Central del Ecuador."
	/>
	<meta
		name="keywords"
		content="chat IA, investigación geoespacial, datos cartográficos, SIG, Universidad Central Ecuador, UYANA"
	/>
</svelte:head>

{#if isReady}
	<div class="chat-page" data-theme="light">
		<div class="chat-container">
			<div class="chat-card">
				<ChatInterfaceModern />
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	.chat-page {
		min-height: 100vh;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(
			135deg,
			rgba(var(--color--primary-rgb), 0.03) 0%,
			rgba(var(--color--secondary-rgb), 0.03) 100%
		);
		padding: 20px;
		box-sizing: border-box;
	}

	.chat-container {
		width: 100%;
		max-width: 1200px;
		height: calc(100vh - 40px);
		max-height: 800px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.chat-card {
		width: 100%;
		height: 100%;
		background: var(--color--card-background);
		border-radius: 16px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1), 0 1px 8px rgba(0, 0, 0, 0.05);
		border: 1px solid rgba(var(--color--border-rgb), 0.1);
		backdrop-filter: blur(10px);
		overflow: hidden;
		transition: all 0.3s ease;

		&:hover {
			box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15), 0 2px 12px rgba(0, 0, 0, 0.08);
		}
	}

	@media (max-width: 768px) {
		.chat-page {
			padding: 10px;
		}

		.chat-container {
			height: calc(100vh - 20px);
			max-height: none;
		}

		.chat-card {
			border-radius: 12px;
		}
	}

	@media (max-width: 480px) {
		.chat-page {
			padding: 5px;
		}

		.chat-container {
			height: calc(100vh - 10px);
		}

		.chat-card {
			border-radius: 8px;
		}
	}
</style>
