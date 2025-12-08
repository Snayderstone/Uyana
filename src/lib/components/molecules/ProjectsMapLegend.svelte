<!-- src/lib/components/molecules/ProjectsMapLegend.svelte -->
<script lang="ts">
	export let minValue: number = 0;
	export let maxValue: number = 0;
	export let title: string = 'Proyectos por Facultad';
</script>

<div class="map-legend">
	<div class="legend-title">{title}</div>
	<div class="legend-subtitle">Intensidad de color según cantidad</div>

	<div class="legend-scale">
		<div class="color-gradient" />

		<div class="scale-labels">
			<div class="scale-label">{minValue}</div>
			<div class="scale-label">{Math.round((minValue + maxValue) / 2)}</div>
			<div class="scale-label">{maxValue}</div>
		</div>
	</div>
</div>

<style>
	.map-legend {
		background: var(--color--card-background);
		padding: 10px 15px;
		border-radius: 8px;
		box-shadow: var(--card-shadow);
		min-width: 200px;
		color: var(--color--text);
	}

	.legend-title {
		font-size: 0.9rem;
		font-weight: 600;
		margin-bottom: 2px;
		color: var(--color--text);
	}

	.legend-subtitle {
		font-size: 0.75rem;
		font-style: italic;
		color: var(--color--text-shade);
		margin-bottom: 8px;
	}

	.legend-scale {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.color-gradient {
		height: 10px;
		border-radius: 5px;
		background: linear-gradient(
			to right,
			color-mix(in srgb, var(--color--primary, #6e29e7) 5%, white),
			color-mix(in srgb, var(--color--primary, #6e29e7) 20%, white),
			color-mix(in srgb, var(--color--primary, #6e29e7) 45%, white),
			color-mix(in srgb, var(--color--primary, #6e29e7) 70%, white),
			color-mix(in srgb, var(--color--primary, #6e29e7) 100%, white)
		);
	}

	.scale-labels {
		display: flex;
		justify-content: space-between;
		font-size: 0.8rem;
		color: var(--color--text-shade);
	}

	.scale-label {
		font-weight: 500;
	}
</style>
