<script lang="ts">
	import MapExplorer from '$lib/components/organisms/MapExplorer.svelte';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	const { mapConfig } = data;

	let pageHeight: number;

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
</script>

<svelte:head>
	<title>Explorador de Mapa | Uyana</title>
	<meta name="description" content="Explora ubicaciones interesantes en nuestro mapa interactivo" />
</svelte:head>

<div class="map-page" style="--page-height: {pageHeight}px">
	<div class="map-header">
		<h1>Explorador de Mapa</h1>
		<p class="description">
			Descubre y explora ubicaciones interesantes en nuestro mapa interactivo. Utiliza los filtros
			para encontrar lugares específicos o busca directamente por nombre.
		</p>
	</div>

	<div class="map-container" style="height: {pageHeight}px">
		<MapExplorer center={mapConfig.initialCenter} zoom={mapConfig.initialZoom} />
	</div>
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
			margin-bottom: 20px;

			@include for-phone-only {
				font-size: 1rem;
			}
		}
	}

	.map-container {
		width: 100%;
		height: var(--map-height);
		min-height: 500px;
		position: relative;
		margin-bottom: 40px;
	}
</style>
