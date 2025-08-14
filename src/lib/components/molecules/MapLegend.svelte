<script lang="ts">
	// Lista de categorías y sus colores para la leyenda
	export let legendItems = [
		{ name: 'Restaurantes', color: '#FF5733' },
		{ name: 'Hoteles', color: '#33A1FF' },
		{ name: 'Tiendas', color: '#33FF57' },
		{ name: 'Atracciones', color: '#F033FF' }
	];
</script>

<div class="map-legend">
	<div class="legend-title">Leyenda</div>
	<div class="legend-items">
		{#each legendItems as item}
			<div class="legend-item">
				<div class="legend-color" style:background-color={item.color} />
				<div class="legend-name">{item.name}</div>
			</div>
		{/each}
	</div>
</div>

<style lang="scss">
	.map-legend {
		background-color: var(--color--card-background);
		border-radius: 10px;
		padding: 15px;
		box-shadow: var(--card-shadow);
		z-index: 10;
		min-width: 150px;
	}

	.legend-title {
		font-weight: 700;
		font-size: 0.9rem;
		margin-bottom: 10px;
		color: var(--color--text-shade);
	}

	.legend-items {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.legend-color {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		border: 1px solid rgba(0, 0, 0, 0.1);
	}

	.legend-name {
		font-size: 0.85rem;
		color: var(--color--text);
	}
</style>
