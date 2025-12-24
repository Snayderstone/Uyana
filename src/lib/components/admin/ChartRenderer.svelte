<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import type { ChartConfiguration } from 'chart.js';

	// Registrar todos los componentes de Chart.js
	Chart.register(...registerables);

	export let chartId: string;
	export let config: ChartConfiguration;
	export let height: number = 300;

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;
	let container: HTMLDivElement;
	let isVisible = false;

	// Intersection Observer para lazy loading
	let observer: IntersectionObserver;

	function initChart() {
		if (chart) {
			chart.destroy();
		}

		if (canvas && config) {
			chart = new Chart(canvas, config);
		}
	}

	function destroyChart() {
		if (chart) {
			chart.destroy();
			chart = null;
		}
	}

	function updateChart() {
		if (chart && config) {
			chart.data = config.data;
			chart.options = config.options || {};
			chart.update('none'); // Update without animation for performance
		}
	}

	onMount(() => {
		// Intersection Observer para lazy loading
		observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && !isVisible) {
						isVisible = true;
						// Pequeño delay para mejor performance
						setTimeout(() => {
							initChart();
						}, 100);
					}
				});
			},
			{
				rootMargin: '50px', // Cargar un poco antes de que sea visible
				threshold: 0.1
			}
		);

		if (container) {
			observer.observe(container);
		}
	});

	onDestroy(() => {
		if (observer && container) {
			observer.unobserve(container);
			observer.disconnect();
		}
		destroyChart();
	});

	// Reactively update chart when config changes
	$: if (isVisible && chart && config) {
		updateChart();
	}

	// Export method to get chart as image
	export function getImageDataURL(): string | null {
		return chart?.toBase64Image() || null;
	}
</script>

<div bind:this={container} class="chart-container" style="height: {height}px;">
	{#if isVisible}
		<canvas bind:this={canvas} id={chartId} />
	{:else}
		<div class="chart-loading">
			<div class="loading-spinner" />
			<p>Cargando gráfico...</p>
		</div>
	{/if}
</div>

<style>
	.chart-container {
		position: relative;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	canvas {
		max-width: 100%;
		max-height: 100%;
	}

	.chart-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		color: #6b7280;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #e5e7eb;
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
