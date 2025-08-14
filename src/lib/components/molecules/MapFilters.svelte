<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import type { Map, Marker } from 'leaflet';

	// Definimos las categorías de filtros
	export let categories = ['Restaurantes', 'Hoteles', 'Tiendas', 'Atracciones'];
	export let selectedCategory = '';

	// Definimos el mapa para poder interactuar con él - se utilizará en futuras implementaciones
	export const map: Map | null = null;

	// Emitimos un evento cuando se seleccione una categoría
	function selectCategory(category: string) {
		if (selectedCategory === category) {
			selectedCategory = '';
		} else {
			selectedCategory = category;
		}
		// Aquí se dispararía un evento para actualizar los marcadores según la categoría
	}
</script>

<div class="map-filters">
	<div class="filter-title">Filtrar por:</div>
	<div class="filter-buttons">
		{#each categories as category}
			<Button
				color="primary"
				style={selectedCategory === category ? 'solid' : 'understated'}
				size="small"
				on:click={() => selectCategory(category)}
			>
				{category}
			</Button>
		{/each}
	</div>
</div>

<style lang="scss">
	.map-filters {
		background-color: var(--color--card-background);
		border-radius: 10px;
		padding: 15px;
		box-shadow: var(--card-shadow);
		z-index: 10;
		display: flex;
		flex-direction: column;
		gap: 10px;
		max-width: 100%;
		width: auto;
		flex: 1;
	}

	.filter-title {
		font-weight: 700;
		font-size: 0.9rem;
		color: var(--color--text-shade);
	}

	.filter-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
</style>
