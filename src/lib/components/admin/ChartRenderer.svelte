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
	let themeObserver: MutationObserver;

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

	// Detectar cambios de tema y re-renderizar
	function setupThemeObserver() {
		if (typeof document === 'undefined') return;

		themeObserver = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
					// El tema cambió, forzar colores correctos
					if (isVisible && config) {
						// Detectar tema actual
						const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
						const textColor = isDark ? '#ffffff' : '#1a1a1a';
						const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

						// Actualizar colores en la configuración
						if (config.options) {
							// Actualizar colores de plugins
							if (config.options.plugins) {
								if (config.options.plugins.legend?.labels) {
									config.options.plugins.legend.labels.color = textColor;
								}
								if (config.options.plugins.tooltip) {
									config.options.plugins.tooltip.backgroundColor = isDark
										? 'rgba(0, 0, 0, 0.8)'
										: 'rgba(255, 255, 255, 0.95)';
									config.options.plugins.tooltip.titleColor = textColor;
									config.options.plugins.tooltip.bodyColor = textColor;
								}
							}

							// Actualizar colores de escalas
							if (config.options.scales) {
								Object.keys(config.options.scales).forEach((key) => {
									const scale = config.options.scales![key];
									if (scale) {
										if (scale.ticks) {
											scale.ticks.color = textColor;
										}
										if (scale.grid) {
											scale.grid.color = gridColor;
										}
									}
								});
							}
						}

						// Re-renderizar con nueva configuración
						setTimeout(() => {
							destroyChart();
							initChart();
						}, 50);
					}
				}
			});
		});

		themeObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme']
		});
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

		// Configurar observador de tema
		setupThemeObserver();
	});

	onDestroy(() => {
		if (observer && container) {
			observer.unobserve(container);
			observer.disconnect();
		}
		if (themeObserver) {
			themeObserver.disconnect();
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
		color: var(--color--text-shade);
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid rgba(var(--color--text-rgb), 0.1);
		border-top-color: var(--color--primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
