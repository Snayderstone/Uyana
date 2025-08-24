<!-- src/lib/components/molecules/HorizontalBarChart.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { elasticOut } from 'svelte/easing';

	// Propiedades del componente
	export let data: Array<{ label: string; value: number; colorVarName?: string }> = [];
	export let title: string = '';
	export let width: number = 600;
	export let height: number = 300;
	export let marginTop: number = 20;
	export let marginRight: number = 40;
	export let marginBottom: number = 40;
	export let marginLeft: number = 140;
	export let barPadding: number = 0.3;
	export let barHeight: number = 25;
	export let yLabel: string = '';
	export let showPercentage: boolean = true;

	// Elementos del DOM
	let svgElement: SVGElement;
	let innerWidth: number;
	let innerHeight: number;

	// Colores
	const defaultColors = [
		'--color--primary',
		'--color--secondary',
		'--color--callout-accent--info',
		'--color--callout-accent--success',
		'--color--callout-accent--warning',
		'--color--callout-accent--error'
	];

	// Animaciones
	const animationProgress = tweened(0, {
		duration: 1200,
		easing: elasticOut
	});

	// Calcular dimensiones
	$: {
		innerWidth = width - marginLeft - marginRight;
		innerHeight = Math.max(
			height - marginTop - marginBottom,
			data.length * (barHeight + barPadding * barHeight)
		);
	}

	// Calcular escalas
	$: maxValue = Math.max(...data.map((d) => d.value), 1);
	$: xScale = (value: number) => (value / maxValue) * innerWidth * $animationProgress;
	$: yScale = (index: number) => index * (barHeight + barPadding * barHeight);

	// Comenzar la animación cuando el componente se monte
	onMount(() => {
		animationProgress.set(1);
		return () => {
			animationProgress.set(0);
		};
	});

	// Colorear cada barra
	function getColor(item: { colorVarName?: string }, index: number): string {
		if (item.colorVarName) {
			return `var(${item.colorVarName})`;
		} else {
			return `var(${defaultColors[index % defaultColors.length]})`;
		}
	}

	// Formatear valores
	function formatValue(value: number): string {
		return value.toLocaleString();
	}

	// Calcular el total para los porcentajes
	$: totalValue = data.reduce((sum, item) => sum + item.value, 0);

	// Calcular porcentaje
	function getPercentage(value: number): string {
		if (!totalValue) return '0%';
		return `${Math.round((value / totalValue) * 100)}%`;
	}

	// Formatear etiquetas para evitar desbordamiento
	function formatLabel(label: string, maxLength = 20): string {
		if (label.length > maxLength) {
			return label.substring(0, maxLength - 3) + '...';
		}
		return label;
	}

	// Crear valores para el eje X
	$: xTicks = Array.from({ length: 5 }, (_, i) => (maxValue * (i + 1)) / 5);

	// Estado para barras resaltadas
	let highlightedBar: number | null = null;

	// Funciones para resaltar/desresaltar barras
	function highlightBar(index: number) {
		highlightedBar = index;
	}

	function resetHighlight() {
		highlightedBar = null;
	}
</script>

<div class="horizontal-bar-chart">
	{#if title}
		<h3 class="chart-title">{title}</h3>
	{/if}

	{#if showPercentage && data.length > 0}
		<div class="summary">
			<span>Total: <strong>{totalValue}</strong> proyectos</span>
		</div>
	{/if}

	<div class="chart-container">
		<svg bind:this={svgElement} {width} {height} aria-label={title}>
			<!-- Eje X (valores) -->
			<line
				x1={marginLeft}
				y1={marginTop + innerHeight}
				x2={marginLeft + innerWidth}
				y2={marginTop + innerHeight}
				class="axis-line"
			/>

			{#each xTicks as tick}
				<line
					x1={marginLeft + xScale(tick)}
					y1={marginTop + innerHeight}
					x2={marginLeft + xScale(tick)}
					y2={marginTop + innerHeight + 6}
					class="tick-line"
				/>
				<text
					x={marginLeft + xScale(tick)}
					y={marginTop + innerHeight + 20}
					text-anchor="middle"
					class="tick-text"
				>
					{formatValue(tick)}
				</text>
			{/each}

			<!-- Etiqueta del eje Y -->
			{#if yLabel}
				<text
					x={marginLeft + innerWidth / 2}
					y={marginTop + innerHeight + 40}
					text-anchor="middle"
					class="axis-label"
				>
					{yLabel}
				</text>
			{/if}

			<!-- Líneas de referencia vertical -->
			{#each xTicks as tick}
				<line
					x1={marginLeft + xScale(tick)}
					y1={marginTop}
					x2={marginLeft + xScale(tick)}
					y2={marginTop + innerHeight}
					class="grid-line"
				/>
			{/each}

			<!-- Barras de datos -->
			{#each data as item, i}
				<g
					class="bar-group"
					class:highlight={highlightedBar === i}
					class:fade={highlightedBar !== null && highlightedBar !== i}
					on:mouseover={() => highlightBar(i)}
					on:mouseout={resetHighlight}
					on:focus={() => highlightBar(i)}
					on:blur={resetHighlight}
					tabindex="0"
					role="button"
					aria-label="{item.label}: {item.value} ({getPercentage(item.value)})"
				>
					<!-- Barra de fondo -->
					<rect
						x={marginLeft}
						y={marginTop + yScale(i)}
						width={innerWidth}
						height={barHeight}
						rx={4}
						ry={4}
						class="bar-background"
					/>

					<!-- Barra de valor -->
					<rect
						x={marginLeft}
						y={marginTop + yScale(i)}
						width={xScale(item.value)}
						height={barHeight}
						rx={4}
						ry={4}
						class="bar-foreground"
						style="fill: {getColor(item, i)};"
					>
						<title>{item.label}: {item.value} ({getPercentage(item.value)})</title>
					</rect>

					<!-- Etiqueta de la barra (categoría) -->
					<text
						x={marginLeft - 10}
						y={marginTop + yScale(i) + barHeight / 2}
						text-anchor="end"
						dominant-baseline="middle"
						class="bar-label"
					>
						{formatLabel(item.label)}
					</text>

					<!-- Valor numérico fuera de la barra -->
					<text
						x={marginLeft + xScale(item.value) + 5}
						y={marginTop + yScale(i) + barHeight / 2}
						text-anchor="start"
						dominant-baseline="middle"
						class="bar-value"
					>
						{formatValue(item.value)}
						{showPercentage ? `(${getPercentage(item.value)})` : ''}
					</text>

					<!-- Porcentaje dentro de la barra si hay suficiente espacio -->
					{#if showPercentage && xScale(item.value) > 70}
						<text
							x={marginLeft + xScale(item.value) - 35}
							y={marginTop + yScale(i) + barHeight / 2}
							text-anchor="end"
							dominant-baseline="middle"
							class="bar-percentage"
						>
							{getPercentage(item.value)}
						</text>
					{/if}
				</g>
			{/each}
		</svg>
	</div>
</div>

<style lang="scss">
	.horizontal-bar-chart {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1rem;
		position: relative;
		font-family: var(--font-family-sans);
	}

	.chart-title {
		font-size: 1.25rem;
		color: var(--color--text);
		margin-bottom: 0.5rem;
		font-weight: 600;
		text-align: center;
	}

	.summary {
		font-size: 0.9rem;
		color: var(--color--text-shade);
		text-align: center;
		margin-bottom: 1rem;

		strong {
			font-weight: 600;
			color: var(--color--text);
		}
	}

	.chart-container {
		position: relative;
		width: 100%;
	}

	.axis-line {
		stroke: var(--color--text-shade);
		stroke-width: 1;
	}

	.tick-line {
		stroke: var(--color--text-shade);
		stroke-width: 1;
	}

	.tick-text {
		font-size: 0.75rem;
		fill: var(--color--text-shade);
		text-anchor: middle;
	}

	.axis-label {
		font-size: 0.9rem;
		fill: var(--color--text);
		font-weight: 500;
	}

	.grid-line {
		stroke: var(--color--text-shade);
		stroke-opacity: 0.15;
		stroke-width: 1;
		stroke-dasharray: 3 3;
	}

	.bar-background {
		fill: var(--color--text-shade);
		fill-opacity: 0.1;
	}

	.bar-foreground {
		transition: width 0.5s ease;
	}

	.bar-label {
		font-size: 0.85rem;
		fill: var(--color--text);
		font-weight: 500;
	}

	.bar-value {
		font-size: 0.85rem;
		fill: var(--color--text);
		font-weight: 600;
	}

	.bar-percentage {
		font-size: 0.85rem;
		fill: white;
		font-weight: 600;
		text-shadow: 0px 0px 2px rgba(0, 0, 0, 0.5);
	}

	.bar-group {
		transition: transform 0.3s ease, opacity 0.3s ease;

		&:hover,
		&.highlight {
			.bar-foreground {
				filter: brightness(1.1);
				filter: drop-shadow(0px 0px 5px rgba(0, 0, 0, 0.3));
			}

			transform: translateY(-2px);

			.bar-value,
			.bar-label,
			.bar-percentage {
				font-weight: 700;
			}
		}

		&.fade {
			opacity: 0.4;
		}

		&:active {
			transform: translateY(1px);
		}

		&:focus {
			outline: none;

			.bar-foreground {
				stroke: var(--color--text);
				stroke-width: 2px;
				stroke-dasharray: 3 2;
			}
		}
	}
</style>
