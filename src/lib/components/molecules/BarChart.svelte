<!-- src/lib/components/molecules/BarChart.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	export let data: Array<{ label: string; value: number; colorVarName?: string | null }> = [];
	export let title = '';
	export let unit = '';

	export let width = 640;
	export let height = 360;

	// Nuevas propiedades para paginación y filtrado
	export let itemsPerPage = 10;
	export let showSearch = true;
	export let showHorizontal = true; // Mostrar barras horizontalmente

	export let marginTop = 24;
	export let marginRight = 16;
	export let marginBottom = 56;
	export let marginLeft = 56;

	export let axisYWidth = 56;
	export let axisXHeight = 56;

	export let yMin = 0;
	export let yMax: number | null = null;
	export let yTickCount = 5;
	export let xRotate = -45;
	export let xLabel = '';
	export let yLabel = '';
	export let showGrid = true;

	export let barCornerRadius = 4;
	export let barGapRatio = 0.2;

	$: W = Math.max(200, width);
	$: H = Math.max(180, height);

	$: mlEff = Math.max(marginLeft, axisYWidth);
	$: mbEff = Math.max(marginBottom, axisXHeight);
	$: mtEff = Math.max(0, marginTop);
	$: mrEff = Math.max(0, marginRight);

	$: innerW = Math.max(1, W - mlEff - mrEff);
	$: innerH = Math.max(1, H - mtEff - mbEff);

	$: categories = data.map((d) => d.label);

	$: maxData = Math.max(1, ...data.map((d) => d.value || 0));
	$: yMaxEff = yMax == null ? Math.ceil(maxData * 1.1) : yMax;
	$: yMinEff = Math.min(yMin, yMaxEff - 1);

	$: n = Math.max(0, data.length);
	$: cellW = n > 0 ? innerW / n : innerW;
	$: gap = Math.min(cellW * barGapRatio, cellW * 0.5);
	$: barW = Math.max(8, cellW - gap);

	// Función para mapear valor a altura
	$: valueToHeight = (value: number) => {
		const range = yMaxEff - yMinEff;
		const normalized = (value - yMinEff) / range;
		return normalized * innerH;
	};

	// Función para generar ticks para el eje Y
	function generateYTicks(min: number, max: number, count: number) {
		const ticks = [];
		const range = max - min;
		const step = range / (count - 1);

		for (let i = 0; i < count; i++) {
			ticks.push(Math.round((min + i * step) * 100) / 100);
		}

		return ticks;
	}

	$: yTicks = generateYTicks(yMinEff, yMaxEff, yTickCount);

	// Posición X de cada barra
	const xPos = (i: number) => mlEff + i * cellW + (cellW - barW) / 2;

	// Generar ID único para las animaciones
	const uid = `bar-chart-${Math.random().toString(36).substring(2, 9)}`;

	// Variables para filtrado y paginación
	let searchTerm = '';
	let currentPage = 1;
	let sortDirection: 'asc' | 'desc' = 'desc';

	// Datos filtrados y paginados
	$: filteredData = data
		.filter((item) => item.label.toLowerCase().includes(searchTerm.toLowerCase()))
		.sort((a, b) => {
			return sortDirection === 'asc' ? a.value - b.value : b.value - a.value;
		});

	$: totalPages = Math.ceil(filteredData.length / itemsPerPage);
	$: currentPageData = filteredData.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	// Animación para barras horizontales
	const barAnimation = tweened(0, {
		duration: 900,
		easing: cubicOut
	});

	// Colores predefinidos para barras (paleta más moderna e impactante)
	const colorPalette = [
		'--color--primary',
		'--color--secondary',
		'--color--callout-accent--info',
		'--color--callout-accent--success',
		'--color--callout-accent--warning',
		'--color--callout-accent--error',
		'#5B8FF9',
		'#5AD8A6',
		'#5D7092',
		'#F6BD16',
		'#E86452',
		'#6DC8EC',
		'#945FB9',
		'#FF9845',
		'#1E9493'
	];

	// Asignar colores a categorías consistentemente
	function getColor(index: number, colorVarName?: string | null): string {
		if (colorVarName) {
			return `var(${colorVarName})`;
		}
		// Para los primeros 5 elementos, usar variables CSS, para el resto usar colores HEX directos
		if (index < 5) {
			return `var(${colorPalette[index]})`;
		}
		return colorPalette[5 + ((index - 5) % (colorPalette.length - 5))];
	}

	// Cambiar página
	function nextPage() {
		if (currentPage < totalPages) {
			currentPage++;
			resetAnimation();
		}
	}

	function prevPage() {
		if (currentPage > 1) {
			currentPage--;
			resetAnimation();
		}
	}

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
			resetAnimation();
		}
	}

	// Cambiar orden
	function toggleSort() {
		sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		resetAnimation();
	}

	// Reiniciar animación
	function resetAnimation() {
		barAnimation.set(0);
		setTimeout(() => barAnimation.set(1), 50);
	}

	// Función para formatear números grandes
	function formatNumber(num: number): string {
		return new Intl.NumberFormat().format(num);
	}

	onMount(() => {
		// Iniciar animación
		barAnimation.set(1);
	});
</script>

<div class="bar-chart">
	<div class="bar-chart__header">
		{#if title}
			<h3 class="bar-chart__title">
				{title}
				<span class="chart-subtitle">
					{filteredData.length}
					{filteredData.length === 1 ? 'entidad' : 'entidades'} · {data.reduce(
						(sum, item) => sum + item.value,
						0
					)} proyectos totales
				</span>
			</h3>
		{/if}

		<div class="bar-chart__controls">
			{#if showSearch}
				<div class="search-container">
					<svg
						class="search-icon"
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
						<circle cx="11" cy="11" r="8" />
						<line x1="21" y1="21" x2="16.65" y2="16.65" />
					</svg>
					<input
						type="text"
						placeholder="Buscar facultad o entidad..."
						class="search-input"
						bind:value={searchTerm}
					/>
					{#if searchTerm}
						<button
							class="search-clear"
							on:click={() => (searchTerm = '')}
							aria-label="Limpiar búsqueda"
						>
							×
						</button>
					{/if}
				</div>
			{/if}

			<button
				class="sort-button"
				on:click={toggleSort}
				aria-label="Cambiar orden"
				class:asc={sortDirection === 'asc'}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					{#if sortDirection === 'asc'}
						<polyline points="18 15 12 9 6 15" />
					{:else}
						<polyline points="6 9 12 15 18 9" />
					{/if}
				</svg>
				<span>{sortDirection === 'asc' ? 'Ascendente' : 'Descendente'}</span>
			</button>
		</div>
	</div>

	{#if filteredData.length === 0}
		<div class="no-results">
			<p>
				No se encontraron entidades o facultades que coincidan con "<strong>{searchTerm}</strong>"
			</p>
			<button class="reset-button" on:click={() => (searchTerm = '')}>
				Mostrar todas las facultades/entidades
			</button>
		</div>
	{:else if showHorizontal}
		<!-- Vista de barras horizontales para mejor visualización de muchas categorías -->
		<div class="horizontal-bars">
			{#each currentPageData as d, i}
				{@const maxValue = Math.max(...filteredData.map((item) => item.value))}
				{@const barWidth = (d.value / maxValue) * 100 * $barAnimation}
				{@const color = getColor(i, d.colorVarName)}
				{@const animationDelay = i * 120}
				{@const percentage = Math.round((d.value / maxValue) * 100)}

				<div
					class="bar-item"
					tabindex="0"
					role="button"
					style="border-left-color: {color};"
					aria-label="{d.label}: {d.value} {unit}"
				>
					<!-- Indicador de ranking mejorado -->
					<div class="rank-indicator-container">
						<div
							class="rank-indicator"
							style="color: {color}; background-color: color-mix(in srgb, {color} 15%, var(--color--card-background)); box-shadow: inset 0px -3px 0px color-mix(in srgb, {color} 30%, transparent), 0 3px 8px color-mix(in srgb, {color} 40%, transparent), 0 0 0 2px {color};"
						>
							{i + 1 + (currentPage - 1) * itemsPerPage}
						</div>
					</div>

					<!-- Información de la entidad -->
					<div class="bar-info">
						<!-- Nombre y valor -->
						<div class="bar-header">
							<div class="label-container">
								<span class="label-text" title={d.label}>
									{d.label}
								</span>
							</div>
							<span class="bar-value" style="border: 1px solid {color}; color: {color};"
								>{formatNumber(d.value)}{unit}</span
							>
						</div>

						<!-- Barra de progreso moderna -->
						<div class="bar-container">
							<div class="bar-bg" />
							<div
								class="horizontal-bar"
								style="
									width: {barWidth}%; 
									background-color: {color};
									--animation-delay: {animationDelay}ms;
									--bar-color: {color};
								"
							>
								<!-- Efecto brillante en la barra -->
								<div class="shine-effect" />
							</div>
							<!-- Porcentaje -->
							<span class="percentage-indicator" style="color: {color}; border: 1px solid {color};">
								{percentage}%
							</span>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Paginación -->
		{#if totalPages > 1}
			<div class="pagination">
				<button
					class="pagination-button"
					on:click={prevPage}
					disabled={currentPage === 1}
					aria-label="Página anterior"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"><polyline points="15 18 9 12 15 6" /></svg
					>
					<span>Anterior</span>
				</button>

				<!-- Números de página -->
				<div class="page-numbers">
					{#if totalPages <= 7}
						{#each Array(totalPages) as _, i}
							<button
								class="page-number"
								class:active={currentPage === i + 1}
								on:click={() => goToPage(i + 1)}
								aria-label="Ir a la página {i + 1}"
								aria-current={currentPage === i + 1 ? 'page' : undefined}
							>
								{i + 1}
							</button>
						{/each}
					{:else}
						<!-- Primera página -->
						<button
							class="page-number"
							class:active={currentPage === 1}
							on:click={() => goToPage(1)}
							aria-current={currentPage === 1 ? 'page' : undefined}
						>
							1
						</button>

						<!-- Páginas alrededor de la actual -->
						{#if currentPage > 3}
							<span class="ellipsis">...</span>
						{/if}

						{#each Array(3) as _, i}
							{@const pageNum = Math.max(2, Math.min(currentPage - 1 + i, totalPages - 1))}
							{#if pageNum > 1 && pageNum < totalPages}
								<button
									class="page-number"
									class:active={currentPage === pageNum}
									on:click={() => goToPage(pageNum)}
									aria-current={currentPage === pageNum ? 'page' : undefined}
								>
									{pageNum}
								</button>
							{/if}
						{/each}

						{#if currentPage < totalPages - 2}
							<span class="ellipsis">...</span>
						{/if}

						<!-- Última página -->
						<button
							class="page-number"
							class:active={currentPage === totalPages}
							on:click={() => goToPage(totalPages)}
							aria-current={currentPage === totalPages ? 'page' : undefined}
						>
							{totalPages}
						</button>
					{/if}
				</div>

				<button
					class="pagination-button"
					on:click={nextPage}
					disabled={currentPage === totalPages}
					aria-label="Página siguiente"
				>
					<span>Siguiente</span>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"><polyline points="9 18 15 12 9 6" /></svg
					>
				</button>
			</div>
		{/if}
	{:else}
		<!-- Vista de gráfico tradicional para pocos elementos -->
		<svg class="bar-chart__svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
			<!-- Fondo -->
			<rect
				x={mlEff}
				y={mtEff}
				width={innerW}
				height={innerH}
				rx="8"
				ry="8"
				fill="color-mix(in srgb, var(--color--card-background) 95%, transparent)"
				stroke="color-mix(in srgb, var(--color--text) 10%, transparent)"
				stroke-width="1"
			/>

			<!-- Líneas de la cuadrícula -->
			{#if showGrid}
				<g class="grid-lines">
					{#each yTicks as tick}
						{@const y = mtEff + innerH - valueToHeight(tick)}
						<line
							x1={mlEff}
							y1={y}
							x2={mlEff + innerW}
							y2={y}
							stroke="color-mix(in srgb, var(--color--text-shade) 20%, transparent)"
							stroke-dasharray="2,2"
						/>
					{/each}
				</g>
			{/if}

			<!-- Eje Y -->
			<g class="y-axis">
				{#each yTicks as tick}
					{@const y = mtEff + innerH - valueToHeight(tick)}
					<line x1={mlEff - 5} y1={y} x2={mlEff} y2={y} stroke="var(--color--text-shade)" />
					<text
						x={mlEff - 10}
						{y}
						text-anchor="end"
						dominant-baseline="middle"
						fill="var(--color--text-shade)"
						font-size="0.8rem"
					>
						{tick}{unit ? ` ${unit}` : ''}
					</text>
				{/each}

				<!-- Título del eje Y -->
				{#if yLabel}
					<text
						x={mlEff - axisYWidth + 10}
						y={mtEff + innerH / 2}
						transform={`rotate(-90, ${mlEff - axisYWidth + 10}, ${mtEff + innerH / 2})`}
						text-anchor="middle"
						fill="var(--color--text)"
						font-size="0.9rem"
						font-weight="600"
					>
						{yLabel}
					</text>
				{/if}
			</g>

			<!-- Eje X -->
			<g class="x-axis">
				{#each data as d, i}
					{@const x = xPos(i) + barW / 2}
					<line
						x1={x}
						y1={mtEff + innerH}
						x2={x}
						y2={mtEff + innerH + 5}
						stroke="var(--color--text-shade)"
					/>
					<text
						{x}
						y={mtEff + innerH + 20}
						text-anchor="end"
						dominant-baseline="middle"
						fill="var(--color--text-shade)"
						font-size="0.8rem"
						transform={`rotate(${xRotate}, ${x}, ${mtEff + innerH + 20})`}
					>
						{d.label}
					</text>
				{/each}

				<!-- Título del eje X -->
				{#if xLabel}
					<text
						x={mlEff + innerW / 2}
						y={H - 10}
						text-anchor="middle"
						fill="var(--color--text)"
						font-size="0.9rem"
						font-weight="600"
					>
						{xLabel}
					</text>
				{/if}
			</g>

			<!-- Barras -->
			<g class="bars">
				{#each data as d, i}
					{@const barHeight = valueToHeight(d.value)}
					{@const x = xPos(i)}
					{@const y = mtEff + innerH - barHeight}
					{@const color = d.colorVarName ? `var(${d.colorVarName})` : `var(--color--primary)`}

					<!-- Sombras -->
					<rect
						x={x + 2}
						y={y + 2}
						width={barW}
						height={barHeight}
						rx={barCornerRadius}
						ry={barCornerRadius}
						fill="rgba(0,0,0,0.1)"
						opacity="0.5"
					/>

					<!-- Barra principal -->
					<rect
						class="bar"
						{x}
						y={mtEff + innerH}
						width={barW}
						height="0"
						rx={barCornerRadius}
						ry={barCornerRadius}
						fill="url(#{uid}-gradient-{i})"
						stroke="color-mix(in srgb, ${color} 50%, transparent)"
						stroke-width="1"
					>
						<!-- Animación de la barra -->
						<animate
							attributeName="height"
							from="0"
							to={barHeight}
							dur="1s"
							begin={`${i * 0.1}s`}
							fill="freeze"
							calcMode="spline"
							keySplines="0.215, 0.61, 0.355, 1"
						/>
						<animate
							attributeName="y"
							from={mtEff + innerH}
							to={y}
							dur="1s"
							begin={`${i * 0.1}s`}
							fill="freeze"
							calcMode="spline"
							keySplines="0.215, 0.61, 0.355, 1"
						/>
					</rect>

					<!-- Valor encima de la barra -->
					<text
						x={x + barW / 2}
						y={y - 10}
						text-anchor="middle"
						fill="var(--color--text)"
						font-size="0.8rem"
						font-weight="600"
						opacity="0"
					>
						{d.value}{unit}
						<animate
							attributeName="opacity"
							from="0"
							to="1"
							dur="0.5s"
							begin={`${i * 0.1 + 1}s`}
							fill="freeze"
						/>
					</text>
				{/each}
			</g>

			<!-- Gradientes para las barras -->
			<defs>
				{#each data as d, i}
					{@const color = d.colorVarName ? `var(${d.colorVarName})` : `var(--color--primary)`}
					<linearGradient id="{uid}-gradient-{i}" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stop-color={color} stop-opacity="1" />
						<stop offset="100%" stop-color={color} stop-opacity="0.7" />
					</linearGradient>
				{/each}
			</defs>
		</svg>
	{/if}
</div>

<style lang="scss">
	@import '$lib/scss/_breakpoints.scss';
	@import '$lib/scss/_animations.scss';

	.bar-chart {
		background: var(--color--card-background);
		border-radius: 16px;
		padding: 1.5rem;
		box-shadow: var(--card-shadow);
		position: relative;
		overflow: hidden;
		border: 1px solid var(--color--border, rgba(150, 150, 150, 0.05));

		&::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			height: 4px;
			background: linear-gradient(
				to right,
				var(--color--primary),
				var(--color--secondary, var(--color--primary))
			);
			z-index: 1;
		}

		@media (prefers-color-scheme: dark) {
			border: 1px solid var(--color--border-highlight, rgba(255, 255, 255, 0.05));
			box-shadow: 0 8px 30px var(--color--shadow, rgba(0, 0, 0, 0.15));
		}

		&__header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 1.5rem;
			flex-wrap: wrap;
			gap: 1rem;

			@include for-phone-only {
				flex-direction: column;
				align-items: flex-start;
			}
		}

		&__title {
			margin: 0;
			font-size: 1.25rem;
			font-weight: 700;
			color: var(--color--text);
		}

		&__controls {
			display: flex;
			gap: 1rem;
			align-items: center;
			flex-wrap: wrap;

			@include for-phone-only {
				width: 100%;
			}
		}

		&__svg {
			width: 100%;
			height: auto;
		}
	}

	.bar {
		cursor: pointer;
		transition: filter 0.2s ease;

		&:hover {
			filter: brightness(1.2);
		}
	}

	.search-container {
		position: relative;
		flex: 1;
		min-width: 200px;
		max-width: 300px;
	}

	.search-input {
		width: 100%;
		padding: 0.75rem 2rem 0.75rem 2.5rem;
		border-radius: 8px;
		border: 1px solid var(--color--text-shade-light, #ccc);
		color: var(--color--text);
		background: var(--color--background);
		font-family: inherit;
		font-size: 0.95rem;
		transition: all 0.2s ease;

		&:focus {
			outline: none;
			border-color: var(--color--primary);
			box-shadow: 0 0 0 3px color-mix(in srgb, var(--color--primary) 20%, transparent);
		}

		&::placeholder {
			color: color-mix(in srgb, var(--color--text-shade) 70%, transparent);
		}

		@media (prefers-color-scheme: dark) {
			background: color-mix(in srgb, var(--color--background) 95%, var(--color--card-background));
			border-color: color-mix(in srgb, var(--color--text-shade) 30%, transparent);

			&:focus {
				box-shadow: 0 0 0 3px color-mix(in srgb, var(--color--primary) 30%, transparent);
				background: var(--color--background);
			}
		}
	}
	.search-clear {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1.25rem;
		color: var(--color--text-shade);
		line-height: 1;
		padding: 0;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: all 0.2s ease;

		&:hover {
			background: color-mix(in srgb, var(--color--text-shade) 10%, transparent);
			color: var(--color--text);
		}
	}

	.sort-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		border: 1px solid var(--color--text-shade-light, #ccc);
		background: color-mix(in srgb, var(--color--background) 95%, transparent);
		color: var(--color--text-shade);
		font-family: inherit;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;

		svg {
			transition: transform 0.3s ease;
		}

		&.asc svg {
			transform: rotate(180deg);
		}

		&:hover {
			background: color-mix(in srgb, var(--color--primary) 10%, transparent);
			border-color: var(--color--primary);
		}
	}

	.chart-subtitle {
		display: block;
		font-size: 0.85rem;
		font-weight: normal;
		color: var(--color--text-shade);
		margin-top: 0.25rem;
	}

	.search-icon {
		position: absolute;
		left: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--color--text-shade);
		pointer-events: none;
	}

	.horizontal-bars {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
		padding: 0.5rem;
		overflow: hidden;
	}

	.bar-item {
		display: flex;
		align-items: center;
		padding: 1.2rem;
		border-radius: 12px;
		background-color: color-mix(in srgb, var(--color--card-background) 80%, transparent);
		box-shadow: 0 3px 10px var(--color--shadow, rgba(70, 70, 70, 0.06));
		transition: all 0.25s ease;
		border-left: 4px solid transparent;
		overflow: hidden;
		position: relative;

		&::after {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: linear-gradient(
				to right,
				rgba(255, 255, 255, 0.03),
				rgba(255, 255, 255, 0.01) 50%,
				rgba(120, 120, 120, 0.02) 100%
			);
			pointer-events: none;
			z-index: 1;
			opacity: 0;
			transition: opacity 0.3s ease;
		}

		&:hover {
			transform: translateY(-3px);
			box-shadow: 0 6px 15px var(--color--shadow, rgba(70, 70, 70, 0.1));
			background-color: color-mix(in srgb, var(--color--card-background) 95%, transparent);

			&::after {
				opacity: 1;
			}
		}

		&:focus {
			outline: 2px solid var(--color--primary);
			outline-offset: 2px;
		}

		@include for-phone-only {
			padding: 0.9rem 0.75rem;
		}

		@media (prefers-color-scheme: dark) {
			box-shadow: 0 3px 10px var(--color--shadow, rgba(0, 0, 0, 0.15));

			&::after {
				background: linear-gradient(
					to right,
					rgba(255, 255, 255, 0.02),
					rgba(255, 255, 255, 0.01) 50%,
					rgba(255, 255, 255, 0.005) 100%
				);
			}

			&:hover {
				box-shadow: 0 6px 15px var(--color--shadow, rgba(0, 0, 0, 0.2));
			}
		}
	}
	.rank-indicator-container {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.rank-indicator {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1rem;
		flex-shrink: 0;
		position: relative;
		z-index: 1;
		border: 2px solid transparent;
		text-shadow: 0 1px 2px var(--color--shadow, rgba(50, 50, 50, 0.3));
		margin-right: 0.75rem;
		transition: transform 0.3s ease, box-shadow 0.3s ease;

		&:hover {
			transform: scale(1.05);
		}

		@include for-phone-only {
			width: 32px;
			height: 32px;
			font-size: 0.9rem;
		}

		@media (prefers-color-scheme: dark) {
			text-shadow: 0 1px 3px var(--color--shadow, rgba(0, 0, 0, 0.3));
			box-shadow: 0 3px 8px var(--color--shadow, rgba(0, 0, 0, 0.25)),
				0 0 0 2px var(--color--border-highlight, rgba(255, 255, 255, 0.1));
		}
	}
	.bar-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		min-width: 0;
	}

	.bar-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;

		@include for-phone-only {
			flex-direction: column;
			gap: 0.25rem;
		}
	}

	.label-container {
		max-width: 550px;
		flex: 1;

		@include for-phone-only {
			max-width: 100%;
		}
	}

	.label-text {
		font-size: 1.05rem;
		font-weight: 500;
		color: var(--color--text);
		white-space: normal; /* Permitir múltiples líneas si es necesario */
		display: block;
		word-wrap: break-word;
		line-height: 1.3;

		@include for-phone-only {
			font-size: 0.95rem;
		}
	}

	.bar-container {
		flex: 1;
		display: flex;
		align-items: center;
		position: relative;
		min-width: 0;
		height: 14px;
		border-radius: 7px;
		overflow: hidden;
		margin-top: 8px;
	}

	.bar-bg {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		background-color: color-mix(in srgb, var(--color--text-shade) 10%, transparent);
		border-radius: 7px;
		border: 1px solid color-mix(in srgb, var(--color--text-shade) 15%, transparent);

		@media (prefers-color-scheme: dark) {
			background-color: rgba(255, 255, 255, 0.05);
			border: 1px solid rgba(255, 255, 255, 0.1);
		}
	}

	.horizontal-bar {
		height: 100%;
		position: relative;
		min-width: 10px;
		opacity: 0;
		transform: scaleX(0);
		transform-origin: left;
		animation: grow-bar 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
		animation-delay: var(--animation-delay);
		border-radius: 7px;
		overflow: hidden;
		box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.3);

		&::after {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 50%;
			background: linear-gradient(to bottom, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0));
		}

		@keyframes grow-bar {
			to {
				opacity: 1;
				transform: scaleX(1);
			}
		}

		@media (prefers-color-scheme: dark) {
			box-shadow: inset 0 0 15px rgba(255, 255, 255, 0.15), 0 0 5px rgba(255, 255, 255, 0.1);

			&::after {
				background: linear-gradient(to bottom, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0));
			}
		}
	}
	.shine-effect {
		position: absolute;
		top: 0;
		left: 0;
		width: 50px;
		height: 100%;
		background: linear-gradient(
			90deg,
			rgba(255, 255, 255, 0) 0%,
			rgba(255, 255, 255, 0.4) 50%,
			rgba(255, 255, 255, 0) 100%
		);
		animation: shine 2s infinite;
		animation-delay: var(--animation-delay);

		@keyframes shine {
			0% {
				transform: translateX(-100%);
			}
			100% {
				transform: translateX(300%);
			}
		}
	}

	.bar-value {
		font-size: 1rem;
		font-weight: 700;
		color: var(--color--text);
		white-space: nowrap;
		background: color-mix(in srgb, var(--color--card-background) 95%, transparent);
		padding: 4px 10px;
		border-radius: 8px;
		min-width: 60px;
		text-align: center;
		border: 1px solid color-mix(in srgb, var(--color--text-shade) 15%, transparent);
		box-shadow: 0 2px 4px var(--color--shadow, rgba(70, 70, 70, 0.05));

		@media (prefers-color-scheme: dark) {
			background: color-mix(in srgb, var(--color--background) 95%, transparent);
			border: 1px solid color-mix(in srgb, var(--color--text-shade) 30%, transparent);
			box-shadow: 0 2px 4px var(--color--shadow, rgba(0, 0, 0, 0.15));
		}
	}

	.percentage-indicator {
		position: absolute;
		right: 0;
		top: -22px;
		font-size: 0.8rem;
		font-weight: 700;
		background-color: var(--color--card-background, rgba(255, 255, 255, 0.9));
		padding: 2px 6px;
		border-radius: 10px;
		box-shadow: 0 2px 4px var(--color--shadow, rgba(70, 70, 70, 0.1));

		@media (prefers-color-scheme: dark) {
			background-color: var(--color--background, rgba(40, 40, 40, 0.9));
			box-shadow: 0 2px 4px var(--color--shadow, rgba(0, 0, 0, 0.15)),
				0 0 0 1px var(--color--border-highlight, rgba(255, 255, 255, 0.1));
		}
	}

	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		margin-top: 2rem;
		flex-wrap: wrap;
	}

	.pagination-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		border: 1px solid var(--color--text-shade-light, #ccc);
		background: color-mix(in srgb, var(--color--background) 95%, transparent);
		color: var(--color--text-shade);
		font-family: inherit;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;

		&:hover:not(:disabled) {
			background: color-mix(in srgb, var(--color--primary) 10%, transparent);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.page-numbers {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.page-number {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 8px;
		border: 1px solid transparent;
		background: transparent;
		color: var(--color--text-shade);
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s ease;

		&:hover:not(.active) {
			background: color-mix(in srgb, var(--color--text-shade) 10%, transparent);
		}

		&.active {
			background: var(--color--primary);
			color: white;
			font-weight: 600;
			transform: scale(1.05);
			box-shadow: 0 2px 8px color-mix(in srgb, var(--color--primary) 40%, transparent);
		}

		@media (prefers-color-scheme: dark) {
			&:hover:not(.active) {
				background: rgba(255, 255, 255, 0.1);
			}

			&.active {
				box-shadow: 0 2px 8px color-mix(in srgb, var(--color--primary) 60%, transparent);
			}
		}
	}
	.ellipsis {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		color: var(--color--text-shade);
	}

	.no-results {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1rem;
		text-align: center;
		color: var(--color--text-shade);
		background: color-mix(in srgb, var(--color--background) 80%, transparent);
		border-radius: 12px;
		border: 1px dashed color-mix(in srgb, var(--color--text-shade) 30%, transparent);

		&::before {
			content: '';
			display: block;
			width: 60px;
			height: 60px;
			margin-bottom: 1.5rem;
			background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3Cline x1='8' y1='11' x2='14' y2='11'%3E%3C/line%3E%3C/svg%3E");
			opacity: 0.6;
		}

		p {
			font-size: 1.1rem;
			margin: 0 0 1.5rem;
			max-width: 400px;
		}
	}

	.reset-button {
		padding: 0.75rem 1.5rem;
		background: var(--color--primary);
		color: white;
		border: none;
		border-radius: 8px;
		font-family: inherit;
		font-size: 0.95rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 4px 10px color-mix(in srgb, var(--color--primary) 30%, transparent);

		&:hover {
			filter: brightness(1.1);
			transform: translateY(-3px);
			box-shadow: 0 6px 14px color-mix(in srgb, var(--color--primary) 40%, transparent);
		}
	}
</style>
