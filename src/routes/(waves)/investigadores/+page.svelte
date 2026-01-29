<script lang="ts">
	import ParticipantsDashboard from '$lib/components/organisms/ParticipantsDashboard.svelte';
	import ParticipantsLeaderboard from '$lib/components/admin/participants/ParticipantsLeaderboard.svelte';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	let activeTab: 'leaderboard' | 'dashboard' = 'leaderboard';
	let loading = true;
	let error: string | null = null;
	let topParticipantes: any[] = [];

	// Cargar datos del leaderboard
	async function cargarLeaderboard() {
		try {
			loading = true;
			error = null;

			// Añadir timestamp para evitar cache de Vercel CDN
			const cacheBuster = `t=${Date.now()}`;
			const response = await fetch(`/api/public/participantes/charts?${cacheBuster}`, {
				cache: 'no-store',
				headers: {
					'Cache-Control': 'no-cache'
				}
			});
			const result = await response.json();

			if (result.success && result.data.topParticipantes) {
				topParticipantes = result.data.topParticipantes;
			}
		} catch (err) {
			error = 'Error al cargar datos';
			console.error(err);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		cargarLeaderboard();
	});

	function setTab(tab: 'leaderboard' | 'dashboard') {
		activeTab = tab;
	}
</script>

<svelte:head>
	<title>Directorio de Investigadores</title>
	<meta
		name="description"
		content="Directorio completo de investigadores de la Universidad Central del Ecuador con sus líneas de investigación, facultad y contacto."
	/>
</svelte:head>

<div class="investigadores-page">
	<div class="page-header">
		<div class="header-content">
			<h1>Investigadores</h1>
			<p class="description">
				Explora la comunidad académica e investigativa de la Universidad Central del Ecuador.
				Descubre los investigadores más activos y consulta estadísticas detalladas de participación.
			</p>
		</div>

		<div class="tab-selector">
			<button
				class="tab-button"
				class:active={activeTab === 'leaderboard'}
				on:click={() => setTab('leaderboard')}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
					<path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
					<path d="M4 22h16" />
					<path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
					<path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
					<path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
				</svg>
				Leaderboard
			</button>
			<button
				class="tab-button"
				class:active={activeTab === 'dashboard'}
				on:click={() => setTab('dashboard')}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
					<line x1="3" y1="9" x2="21" y2="9" />
					<line x1="9" y1="21" x2="9" y2="9" />
				</svg>
				Dashboard
			</button>
		</div>
	</div>

	{#if activeTab === 'leaderboard'}
		<div class="content-container" in:fade={{ duration: 300 }}>
			{#if loading}
				<div class="loading-container">
					<div class="loader" />
					<p>Cargando leaderboard de investigadores...</p>
				</div>
			{:else if error}
				<div class="error-message">
					<h3>⚠️ Error al cargar datos</h3>
					<p>{error}</p>
					<button on:click={cargarLeaderboard}>Intentar de nuevo</button>
				</div>
			{:else if topParticipantes.length === 0}
				<div class="empty-message">
					<h3>Sin datos disponibles</h3>
					<p>No hay datos del ranking de investigadores en este momento</p>
				</div>
			{:else}
				<div class="leaderboard-card">
					<div class="card-header">
						<h2>Ranking de Investigadores Más Activos</h2>
						<p class="card-description">
							Investigadores destacados por su participación en proyectos de investigación
						</p>
					</div>
					<ParticipantsLeaderboard participants={topParticipantes} />
				</div>
			{/if}
		</div>
	{:else if activeTab === 'dashboard'}
		<div class="content-container" in:fade={{ duration: 300 }}>
			<ParticipantsDashboard />
		</div>
	{/if}
</div>

<style lang="scss">
	@import '$lib/scss/breakpoints.scss';

	.investigadores-page {
		width: 100%;
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 20px 40px;
	}

	.page-header {
		margin-bottom: 30px;
		position: relative;
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: flex-start;
		gap: 20px;
		padding-top: 20px;

		.header-content {
			flex: 1;
			min-width: 300px;
		}

		h1 {
			font-size: 2.5rem;
			color: var(--color--text);
			margin-bottom: 10px;

			background: linear-gradient(
				90deg,
				rgb(var(--color--primary-rgb)) 0%,
				rgb(var(--color--secondary-rgb)) 100%
			);
			background-clip: text;
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			display: inline-block;

			@include for-phone-only {
				font-size: 2rem;
			}
		}

		.description {
			font-size: 1.1rem;
			color: var(--color--text-shade);
			max-width: 800px;
			margin-bottom: 10px;

			@include for-phone-only {
				font-size: 1rem;
			}
		}
	}

	.tab-selector {
		display: flex;
		gap: 10px;
		margin-top: 10px;

		@include for-phone-only {
			width: 100%;
			justify-content: space-between;
		}
	}

	.tab-button {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 20px;
		border: 2px solid var(--color--primary);
		background: transparent;
		color: var(--color--primary);
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 1rem;

		svg {
			transition: transform 0.3s ease;
		}

		&:hover {
			background: color-mix(in srgb, var(--color--primary) 10%, transparent);

			svg {
				transform: scale(1.1);
			}
		}

		&.active {
			background: var(--color--primary);
			color: white;
		}

		@include for-phone-only {
			padding: 8px 12px;
			font-size: 0.9rem;
		}
	}

	.content-container {
		width: 100%;
		min-height: 400px;
	}

	.leaderboard-card {
		background: var(--color--card-background, rgba(255, 255, 255, 0.05));
		border-radius: 12px;
		padding: 2rem;
		border: 2px solid color-mix(in srgb, var(--color--primary) 30%, transparent);
		backdrop-filter: blur(10px);
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--color--primary) 5%, transparent),
			color-mix(in srgb, var(--color--secondary) 5%, transparent)
		);
	}

	.card-header {
		text-align: center;
		margin-bottom: 2rem;

		h2 {
			font-size: 2rem;
			font-weight: 700;
			color: var(--color--text);
			margin-bottom: 0.5rem;
		}

		.card-description {
			font-size: 1.125rem;
			color: var(--color--text-shade);
		}
	}

	.loading-container,
	.error-message,
	.empty-message {
		background: var(--color--card-background, rgba(255, 255, 255, 0.05));
		border-radius: 12px;
		padding: 3rem;
		text-align: center;
		border: 1px solid var(--color--border, rgba(255, 255, 255, 0.1));

		p {
			color: var(--color--text-shade);
			font-size: 1.125rem;
			margin-bottom: 1rem;
		}
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.loader {
		border: 4px solid var(--color--border, rgba(0, 0, 0, 0.1));
		border-radius: 50%;
		border-top: 4px solid var(--color--primary);
		width: 50px;
		height: 50px;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.error-message {
		border-color: var(--color--callout-accent--error, rgba(239, 68, 68, 0.3));
		background: color-mix(in srgb, var(--color--callout-accent--error, #ef4444) 10%, transparent);

		h3 {
			color: #ef4444;
		}

		button {
			padding: 0.75rem 1.5rem;
			background: var(--color--primary);
			color: var(--color--button-text, white);
			border: none;
			border-radius: 8px;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
			font-size: 1rem;

			&:hover {
				filter: brightness(1.1);
				transform: translateY(-2px);
			}
		}
	}

	@include for-phone-only {
		.investigadores-page {
			padding: 0 10px 20px;
		}

		.leaderboard-card {
			padding: 1rem;
		}

		.card-header h2 {
			font-size: 1.5rem;
		}
	}
</style>
