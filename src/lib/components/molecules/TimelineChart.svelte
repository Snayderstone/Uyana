<!-- src/lib/components/molecules/TimelineChart.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	// Propiedades del componente
	export let data: Array<{
		id: number;
		titulo: string;
		fecha_inicio: string;
		fecha_fin_planeado: string;
		estado: string;
		tipo_proyecto?: string;
	}> = [];
	export let title: string = '';
	export let width: number = 800;
	export let height: number = 500;
	export let marginTop: number = 40;
	export let marginRight: number = 40;
	export let marginBottom: number = 40;
	export let marginLeft: number = 200;
	export let barHeight: number = 20;
	export let maxDisplayProjects: number = 12;

	// Elementos del DOM
	let svgElement: SVGElement;
	let container: HTMLElement;
	let innerWidth: number;
	let innerHeight: number;

	// Animaciones
	const animationProgress = tweened(0, {
		duration: 1000,
		easing: cubicOut
	});

	// Estado de interacción
	let highlightedProject: number | null = null;
	let showTooltip = false;
	let tooltipX = 0;
	let tooltipY = 0;
	let tooltipData: any = null;
	let searchTerm = '';
	let visibleData = data;

	// Variables para paginación
	let currentPage = 1;
	let totalPages = 1;

	// Función para parsear fechas en formato DD/MM/YYYY
	function parseDate(dateStr: string): Date {
		if (!dateStr) return new Date();
		const [day, month, year] = dateStr.split('/').map(Number);
		return new Date(year, month - 1, day);
	}

	// Calcular dimensiones y escalas
	$: {
		// Filtrar datos basados en búsqueda
		if (searchTerm) {
			visibleData = data.filter(
				(d) =>
					d.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
					d.tipo_proyecto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
					d.estado.toLowerCase().includes(searchTerm.toLowerCase())
			);
		} else {
			visibleData = data;
		}

		// Calcular paginación
		totalPages = Math.ceil(visibleData.length / maxDisplayProjects);

		// Limitar página actual si es necesario
		if (currentPage > totalPages && totalPages > 0) {
			currentPage = totalPages;
		} else if (totalPages === 0) {
			currentPage = 1;
		}

		// Recortar datos para la página actual
		const startIndex = (currentPage - 1) * maxDisplayProjects;
		const pageData = visibleData.slice(startIndex, startIndex + maxDisplayProjects);

		// Calcular fechas mínimas y máximas para escala temporal
		const allDates = pageData.flatMap((d) => [
			parseDate(d.fecha_inicio),
			parseDate(d.fecha_fin_planeado)
		]);

		const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
		const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

		// Añadir margen de 1 mes a cada lado
		minDate.setMonth(minDate.getMonth() - 1);
		maxDate.setMonth(maxDate.getMonth() + 1);

		// Calcular el rango total de días
		const timeRange = maxDate.getTime() - minDate.getTime();

		// Calcular dimensiones internas
		innerWidth = width - marginLeft - marginRight;
		innerHeight = Math.max(height - marginTop - marginBottom, pageData.length * (barHeight + 10));

		// Función para escalar fechas a posición X
		xScale = (date: Date) => {
			const position = ((date.getTime() - minDate.getTime()) / timeRange) * innerWidth;
			return marginLeft + position * $animationProgress;
		};

		// Función para calcular posición Y
		yScale = (index: number) => marginTop + index * (barHeight + 10);

		// Generar marcas de tiempo para el eje X (meses)
		timeMarks = [];
		const currentDate = new Date(minDate);
		while (currentDate <= maxDate) {
			timeMarks.push({
				date: new Date(currentDate),
				position: xScale(new Date(currentDate))
			});
			currentDate.setMonth(currentDate.getMonth() + 1);
		}

		// Preparar datos procesados para la visualización
		processedData = pageData.map((item, index) => {
			const startDate = parseDate(item.fecha_inicio);
			const endDate = parseDate(item.fecha_fin_planeado);

			return {
				...item,
				y: yScale(index),
				startX: xScale(startDate),
				endX: xScale(endDate),
				width: xScale(endDate) - xScale(startDate),
				color: getColorForEstado(item.estado)
			};
		});
	}

	// Variable para la escala X
	let xScale = (date: Date) => marginLeft;

	// Variable para la escala Y
	let yScale = (index: number) => marginTop + index * (barHeight + 10);

	// Variable para las marcas de tiempo
	let timeMarks: Array<{ date: Date; position: number }> = [];

	// Datos procesados para la visualización
	let processedData: any[] = [];

	// Función para obtener color según estado del proyecto
	function getColorForEstado(estado: string): string {
		switch (estado) {
			case 'En ejecución':
				return 'var(--color--callout-accent--success)';
			case 'En cierre':
				return 'var(--color--callout-accent--warning)';
			case 'Cerrado':
			case 'Finalizado':
				return 'var(--color--text-shade)';
			default:
				return 'var(--color--secondary)';
		}
	}

	// Formato de fecha para mostrar
	function formatDate(dateStr: string): string {
		if (!dateStr) return '';
		const date = parseDate(dateStr);
		return date.toLocaleDateString('es-ES', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	// Formatear el nombre del mes
	function formatMonth(date: Date): string {
		return date.toLocaleDateString('es-ES', { month: 'short' });
	}

	// Formatear el año
	function formatYear(date: Date): string {
		return date.toLocaleDateString('es-ES', { year: 'numeric' });
	}

	// Acortar texto si es demasiado largo
	function truncateText(text: string, maxLength: number = 25): string {
		if (text && text.length > maxLength) {
			return text.substring(0, maxLength - 3) + '...';
		}
		return text || '';
	}

	// Mostrar tooltip al hacer hover
	function showProjectTooltip(event: MouseEvent | FocusEvent, project: any) {
		tooltipData = project;
		// Verificar si es un evento de mouse para obtener coordenadas
		if ('clientX' in event) {
			tooltipX = event.clientX;
			tooltipY = event.clientY;
		} else {
			// Para eventos de teclado/focus, usar la posición del elemento
			const rect = (event.currentTarget as Element).getBoundingClientRect();
			tooltipX = rect.right;
			tooltipY = rect.top;
		}
		showTooltip = true;
		highlightedProject = project.id;
	}

	// Ocultar tooltip
	function hideTooltip() {
		showTooltip = false;
		highlightedProject = null;
	}

	// Funciones para paginación
	function nextPage() {
		if (currentPage < totalPages) {
			currentPage++;
			animationProgress.set(0);
			setTimeout(() => animationProgress.set(1), 100);
		}
	}

	function prevPage() {
		if (currentPage > 1) {
			currentPage--;
			animationProgress.set(0);
			setTimeout(() => animationProgress.set(1), 100);
		}
	}

	function handleSearch(event: Event) {
		searchTerm = (event.target as HTMLInputElement).value;
		currentPage = 1;
		animationProgress.set(0);
		setTimeout(() => animationProgress.set(1), 100);
	}

	onMount(() => {
		animationProgress.set(1);
		return () => {
			animationProgress.set(0);
		};
	});
</script>

<div class="timeline-chart" bind:this={container}>
	{#if title}
		<h3 class="chart-title">{title}</h3>
	{/if}

	<!-- Herramientas de búsqueda y filtrado -->
	<div class="chart-controls">
		<div class="search-container">
			<input
				type="text"
				placeholder="Buscar proyectos..."
				value={searchTerm}
				on:input={handleSearch}
				class="search-input"
			/>
		</div>

		<!-- Paginación -->
		<div class="pagination">
			<button
				class="pagination-btn"
				disabled={currentPage === 1}
				on:click={prevPage}
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
			</button>
			<span class="page-info">{currentPage} de {totalPages || 1}</span>
			<button
				class="pagination-btn"
				disabled={currentPage === totalPages || totalPages === 0}
				on:click={nextPage}
				aria-label="Página siguiente"
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
					stroke-linejoin="round"><polyline points="9 18 15 12 9 6" /></svg
				>
			</button>
		</div>
	</div>

	<div class="chart-container">
		<svg bind:this={svgElement} {width} {height} aria-label={title}>
			<!-- Líneas de grid para meses -->
			{#each timeMarks as mark}
				<line
					x1={mark.position}
					y1={marginTop - 15}
					x2={mark.position}
					y2={marginTop + innerHeight}
					class="grid-line"
				/>
				<text
					x={mark.position}
					y={marginTop - 25}
					text-anchor="middle"
					class="time-label month-label"
				>
					{formatMonth(mark.date)}
				</text>
				<!-- Mostrar año solo en enero o primera marca -->
				{#if mark.date.getMonth() === 0 || timeMarks.indexOf(mark) === 0}
					<text
						x={mark.position}
						y={marginTop - 40}
						text-anchor="middle"
						class="time-label year-label"
					>
						{formatYear(mark.date)}
					</text>
				{/if}
			{/each}

			<!-- Proyectos en la línea de tiempo -->
			{#each processedData as project, i}
				<!-- Grupo para cada proyecto -->
				<g
					class="timeline-item"
					class:highlighted={project.id === highlightedProject}
					on:mouseover={(e) => showProjectTooltip(e, project)}
					on:mouseout={hideTooltip}
					on:focus={(e) => showProjectTooltip(e, project)}
					on:blur={hideTooltip}
					role="button"
					aria-label="{project.titulo}: {formatDate(project.fecha_inicio)} - {formatDate(
						project.fecha_fin_planeado
					)}"
					tabindex="0"
				>
					<!-- Etiqueta del proyecto -->
					<text
						x={marginLeft - 10}
						y={project.y + barHeight / 2 + 4}
						text-anchor="end"
						dominant-baseline="middle"
						class="project-label"
					>
						{truncateText(project.titulo, 30)}
					</text>

					<!-- Línea de base -->
					<line
						x1={marginLeft}
						y1={project.y + barHeight / 2}
						x2={marginLeft + innerWidth}
						y2={project.y + barHeight / 2}
						class="baseline"
					/>

					<!-- Barra del proyecto -->
					<rect
						x={project.startX}
						y={project.y}
						width={project.width}
						height={barHeight}
						rx={4}
						ry={4}
						class="project-bar"
						style="fill: {project.color};"
					/>

					<!-- Fechas inicio/fin -->
					<circle
						cx={project.startX}
						cy={project.y + barHeight / 2}
						r={4}
						class="date-marker start-date"
					/>
					<circle
						cx={project.endX}
						cy={project.y + barHeight / 2}
						r={4}
						class="date-marker end-date"
					/>
				</g>
			{/each}
		</svg>

		<!-- Tooltip -->
		{#if showTooltip && tooltipData}
			<div class="tooltip" style="left: {tooltipX + 15}px; top: {tooltipY - 15}px;">
				<h4 class="tooltip-title">{tooltipData.titulo}</h4>
				<div class="tooltip-info">
					<span class="tooltip-label">Estado:</span>
					<span class="tooltip-value">{tooltipData.estado}</span>
				</div>
				<div class="tooltip-info">
					<span class="tooltip-label">Fecha inicio:</span>
					<span class="tooltip-value">{formatDate(tooltipData.fecha_inicio)}</span>
				</div>
				<div class="tooltip-info">
					<span class="tooltip-label">Fecha fin planeado:</span>
					<span class="tooltip-value">{formatDate(tooltipData.fecha_fin_planeado)}</span>
				</div>
				{#if tooltipData.tipo_proyecto}
					<div class="tooltip-info">
						<span class="tooltip-label">Tipo:</span>
						<span class="tooltip-value">{tooltipData.tipo_proyecto}</span>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Leyenda para estados -->
	<div class="chart-legend">
		<div class="legend-item">
			<span class="legend-color" style="background-color: var(--color--callout-accent--success);" />
			<span class="legend-label">En ejecución</span>
		</div>
		<div class="legend-item">
			<span class="legend-color" style="background-color: var(--color--callout-accent--warning);" />
			<span class="legend-label">En cierre</span>
		</div>
		<div class="legend-item">
			<span class="legend-color" style="background-color: var(--color--text-shade);" />
			<span class="legend-label">Finalizado</span>
		</div>
		<div class="legend-item">
			<span class="legend-color" style="background-color: var(--color--secondary);" />
			<span class="legend-label">Otros estados</span>
		</div>
	</div>
</div>

<style lang="scss">
	@import '$lib/scss/_breakpoints.scss';
	@import '$lib/scss/_animations.scss';

	.timeline-chart {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		background: var(--color--card-background, #ffffff);
		border-radius: 12px;
		box-shadow: var(--card-shadow);
		padding: 1.5rem;
		position: relative;
		overflow: hidden;

		@include for-tablet-portrait-down {
			padding: 1rem;
		}
	}

	.chart-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color--text);
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.chart-controls {
		display: flex;
		width: 100%;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;

		@include for-phone-only {
			flex-direction: column;
			gap: 1rem;
		}
	}

	.search-container {
		flex: 1;
		max-width: 300px;

		@include for-phone-only {
			max-width: 100%;
			width: 100%;
		}
	}

	.search-input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		border: 1px solid var(--color--text-shade-light);
		background: var(--color--background);
		color: var(--color--text);
		font-family: inherit;

		&:focus {
			outline: none;
			border-color: var(--color--primary);
			box-shadow: 0 0 0 2px color-mix(in srgb, var(--color--primary) 25%, transparent);
		}
	}

	.pagination {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.page-info {
		font-size: 0.9rem;
		color: var(--color--text-shade);
		min-width: 60px;
		text-align: center;
	}

	.pagination-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 4px;
		background: color-mix(in srgb, var(--color--primary) 10%, transparent);
		border: none;
		color: var(--color--text);
		cursor: pointer;
		transition: all 0.2s ease;

		&:hover:not(:disabled) {
			background: color-mix(in srgb, var(--color--primary) 20%, transparent);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.chart-container {
		width: 100%;
		overflow-x: auto;
		position: relative;
	}

	.grid-line {
		stroke: var(--color--text-shade);
		stroke-opacity: 0.15;
		stroke-width: 1;
		stroke-dasharray: 3 3;
	}

	.time-label {
		font-size: 0.75rem;
		fill: var(--color--text-shade);

		&.year-label {
			font-weight: 700;
			font-size: 0.85rem;
			fill: var(--color--text);
		}
	}

	.project-label {
		font-size: 0.85rem;
		fill: var(--color--text);
		transition: font-weight 0.2s ease;
	}

	.baseline {
		stroke: var(--color--text-shade);
		stroke-opacity: 0.1;
		stroke-width: 1;
	}

	.project-bar {
		transition: transform 0.3s ease, filter 0.3s ease;
		opacity: 0.85;
	}

	.date-marker {
		fill: var(--color--card-background);
		stroke: var(--color--text-shade);
		stroke-width: 2;
		transition: transform 0.3s ease;

		&.start-date {
			fill: var(--color--callout-accent--success);
		}

		&.end-date {
			fill: var(--color--callout-accent--warning);
		}
	}

	.timeline-item {
		&:hover,
		&.highlighted {
			.project-bar {
				opacity: 1;
				filter: brightness(1.1);
				transform: translateY(-2px);
				filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.2));
			}

			.project-label {
				font-weight: 700;
				fill: var(--color--text);
			}

			.date-marker {
				transform: scale(1.2);
			}
		}
	}

	.tooltip {
		position: fixed;
		background: var(--color--card-background);
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		padding: 1rem;
		z-index: 1000;
		max-width: 300px;
		pointer-events: none;
		border: 1px solid var(--color--text-shade-light);

		&::after {
			content: '';
			position: absolute;
			top: 15px;
			left: -8px;
			border-top: 8px solid transparent;
			border-bottom: 8px solid transparent;
			border-right: 8px solid var(--color--card-background);
		}
	}

	.tooltip-title {
		margin: 0 0 0.5rem 0;
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--color--text);
		border-bottom: 1px solid var(--color--text-shade-light);
		padding-bottom: 0.5rem;
	}

	.tooltip-info {
		display: flex;
		margin-bottom: 0.25rem;
	}

	.tooltip-label {
		font-size: 0.8rem;
		color: var(--color--text-shade);
		margin-right: 0.5rem;
		font-weight: 600;
		min-width: 100px;
	}

	.tooltip-value {
		font-size: 0.8rem;
		color: var(--color--text);
	}

	.chart-legend {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1rem;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color--text-shade-light);
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.legend-color {
		width: 12px;
		height: 12px;
		border-radius: 3px;
	}

	.legend-label {
		font-size: 0.8rem;
		color: var(--color--text-shade);
	}
</style>
