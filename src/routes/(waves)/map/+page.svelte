<script lang="ts">
	import ProjectMapExplorer from '$lib/components/organisms/ProjectMapExplorer.svelte';
	import ProjectDashboard from '$lib/components/organisms/ProjectDashboard.svelte';
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import type { PageData } from './$types';

	export let data: PageData;
	const { mapConfig } = data;

	let pageHeight: number;
	let activeTab: 'map' | 'dashboard' | 'participants' = 'map';

	// Ajustar altura de la página para maximizar el espacio para el mapa
	onMount(() => {
		// Calculamos la altura de la ventana menos el header y un poco de espacio para el padding
		pageHeight = window.innerHeight - 120;

		// Escuchar cambios de tamaño de ventana
		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});

	function handleResize() {
		pageHeight = window.innerHeight - 120;
	}

	function setTab(tab: 'map' | 'dashboard' | 'participants') {
		activeTab = tab;
	}
</script>

<svelte:head>
	<title>Explorador de Proyectos | Uyana</title>
	<meta
		name="description"
		content="Explora la distribución geográfica de proyectos de investigación en nuestro mapa interactivo por facultad y obtén estadísticas detalladas."
	/>
</svelte:head>

<div class="map-page" style="--page-height: {pageHeight}px">
	<div class="map-header">
		<div class="header-content">
			<h1>Explorador de Proyectos</h1>
			<p class="description">
				Explora la distribución geográfica de proyectos de investigación por facultad. Utiliza los
				filtros para buscar proyectos específicos o consulta el dashboard para ver estadísticas
				detalladas.
			</p>
		</div>

		<div class="tab-selector">
			<button class="tab-button" class:active={activeTab === 'map'} on:click={() => setTab('map')}>
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
					<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
					<line x1="8" y1="2" x2="8" y2="18" />
					<line x1="16" y1="6" x2="16" y2="22" />
				</svg>
				Mapa de Proyectos
			</button>
			<button
				class="tab-button"
				class:active={activeTab === 'participants'}
				on:click={() => setTab('participants')}
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
					<circle cx="12" cy="7" r="4" />
					<path d="M5.5 21a8.38 8.38 0 0 1 13 0" />
				</svg>
				Participantes
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

	{#if activeTab === 'map'}
		<div
			class="map-container"
			style="height: {pageHeight}px"
			in:fade={{ duration: 300 }}
			out:fade={{ duration: 200 }}
		>
			<ProjectMapExplorer center={mapConfig.initialCenter} zoom={mapConfig.initialZoom} />
		</div>
	{:else if activeTab === 'dashboard'}
		<div class="dashboard-container" in:fade={{ duration: 300 }} out:fade={{ duration: 200 }}>
			<ProjectDashboard />
		</div>
	{:else if activeTab === 'participants'}
		<div class="map-container" in:fade={{ duration: 300 }} out:fade={{ duration: 200 }}>
			<!-- Aún no existe este componente -->
			<!-- Después lo crearemos -->
			<ParticipantsMapExplorer />
		</div>
	{/if}
</div>

<style lang="scss">
	@import '$lib/scss/breakpoints.scss';

	.map-page {
		--map-height: var(--page-height, 70vh);
		width: 100%;
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 20px;
	}

	.map-header {
		margin-bottom: 30px;
		position: relative;
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: flex-start;
		gap: 20px;

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
	}

	.map-container {
		width: 100%;
		height: var(--map-height);
		min-height: 500px;
		position: relative;
		margin-bottom: 40px;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: var(--card-shadow);
	}

	.dashboard-container {
		width: 100%;
		padding: 20px 0;
		min-height: 600px;
		position: relative;
		margin-bottom: 40px;
	}
</style>
