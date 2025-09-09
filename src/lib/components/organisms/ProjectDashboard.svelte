<!-- src/lib/components/organisms/ProjectDashboard.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import StatCard from '$lib/components/atoms/StatCard.svelte';
	import DonutChart from '$lib/components/molecules/DonutChart.svelte';
	import BarChart from '$lib/components/molecules/BarChart.svelte';
	import HorizontalBarChart from '$lib/components/molecules/HorizontalBarChart.svelte';
	import TimelineChart from '$lib/components/molecules/TimelineChart.svelte';
	import ProjectsTable from '$lib/components/molecules/ProjectsTable.svelte';
	import {
		obtenerProyectos,
		obtenerProyectosPorEstado,
		obtenerProyectosPorFacultad,
		obtenerProyectosPorCampoAmplio,
		obtenerProyectosPorAlcance,
		obtenerProyectosPorFinanciamiento,
		obtenerEstadisticasGenerales,
		type Proyecto
	} from '$lib/services/proyectosService';
	import CardCircularStatus from '$lib/components/molecules/CircularStatus.svelte';
	import Card from '../atoms/Card.svelte';

	let loading = true;
	let error: string | null = null;

	// Datos
	let proyectos: Proyecto[] = [];
	let estadisticas = {
		totalProyectos: 0,
		proyectosActivos: 0,
		proyectosCerrados: 0,
		investigadoresAcreditados: 0,
		proyectosPorTipoPrincipal: { tipo: '', cantidad: 0 }
	};
	let proyectosPorEstado: Array<{ estado: string; cantidad: number }> = [];
	let proyectosPorFacultad: Array<{ facultad: string; cantidad: number }> = [];
	let proyectosPorCampo: Array<{ campo: string; cantidad: number }> = [];
	let proyectosPorAlcance: Array<{ alcance: string; cantidad: number }> = [];
	let proyectosPorFinanciamiento: Array<{ fuente: string; cantidad: number }> = [];

	// Pestaña seleccionada
	let activeTab = 'general';

	// Datos para el cronograma de proyectos
	$: timelineData = proyectos.map((p) => ({
		id: p.id,
		titulo: p.titulo,
		fecha_inicio: p.fecha_inicio,
		fecha_fin_planeado: p.fecha_fin_planeado,
		estado: p.estado,
		tipo_proyecto: p.tipo_proyecto
	}));

	// Variable para manejar el ancho responsive
	let width = 800;

	// Cargar datos
	async function cargarDatos() {
		try {
			loading = true;
			error = null;

			// Cargar todo en paralelo
			const [
				proyectosData,
				estadisticasData,
				proyectosPorEstadoData,
				proyectosPorFacultadData,
				proyectosPorCampoData,
				proyectosPorAlcanceData,
				proyectosPorFinanciamientoData
			] = await Promise.all([
				obtenerProyectos(),
				obtenerEstadisticasGenerales(),
				obtenerProyectosPorEstado(),
				obtenerProyectosPorFacultad(),
				obtenerProyectosPorCampoAmplio(),
				obtenerProyectosPorAlcance(),
				obtenerProyectosPorFinanciamiento()
			]);

			proyectos = proyectosData;
			estadisticas = estadisticasData;
			proyectosPorEstado = proyectosPorEstadoData;
			proyectosPorFacultad = proyectosPorFacultadData;
			proyectosPorCampo = proyectosPorCampoData;
			proyectosPorAlcance = proyectosPorAlcanceData;
			proyectosPorFinanciamiento = proyectosPorFinanciamientoData;
		} catch (err) {
			error = 'Error al cargar los datos del dashboard';
			console.error(err);
		} finally {
			loading = false;
		}
	}

	// Adaptar datos para componentes
	$: estadoChartData = proyectosPorEstado.map((item) => ({
		label: item.estado,
		value: item.cantidad,
		colorVarName: getColorForEstado(item.estado)
	}));

	$: facultadChartData = proyectosPorFacultad.map((item) => ({
		label: item.facultad,
		value: item.cantidad
	}));

	$: campoChartData = proyectosPorCampo.slice(0, 6).map((item) => ({
		label: item.campo,
		value: item.cantidad,
		colorVarName: null
	}));

	$: alcanceChartData = proyectosPorAlcance
		.sort((a, b) => b.cantidad - a.cantidad)
		.map((item) => ({
			label: item.alcance,
			value: item.cantidad,
			colorVarName: item.alcance === 'Internacional' ? '--color--secondary' : '--color--primary'
		}));

	$: financiamientoChartData = proyectosPorFinanciamiento.map((item) => ({
		label:
			item.fuente === 'FONDOS_CONCURSABLES_INTERNO_IES'
				? 'Fondos Concursables'
				: item.fuente === 'ASIGNACION_REGULAR_IES'
				? 'Asignación Regular'
				: item.fuente,
		value: item.cantidad,
		colorVarName:
			item.fuente === 'FONDOS_CONCURSABLES_INTERNO_IES'
				? '--color--callout-accent--info'
				: '--color--callout-accent--success'
	}));

	// Asignar colores según el estado
	function getColorForEstado(estado: string): string {
		switch (estado) {
			case 'En ejecución':
				return '--color--callout-accent--success';
			case 'En cierre':
				return '--color--callout-accent--warning';
			case 'Cerrado':
			case 'Finalizado':
				return '--color--text-shade';
			default:
				return '--color--secondary';
		}
	}

	onMount(() => {
		cargarDatos();

		// Establecer el ancho inicial
		updateWidth();

		// Agregar listener para resize
		const resizeObserver = new ResizeObserver(updateWidth);
		const container = document.querySelector('.project-dashboard');
		if (container) {
			resizeObserver.observe(container);
		}

		// Limpiar al desmontar
		return () => {
			if (container) {
				resizeObserver.unobserve(container);
			}
			resizeObserver.disconnect();
		};
	});

	// Función para actualizar el ancho basado en el tamaño del contenedor
	function updateWidth() {
		const container = document.querySelector('.project-dashboard');
		if (container) {
			width = container.clientWidth;
		}
	}

	// Datos estáticos para los íconos
	const iconProjects = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1"></path><path d="M2 13h10"></path><path d="m9 16 3-3-3-3"></path></svg>`;
	const iconActive = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 6 4-4 4 4"></path><path d="M12 2v10.3"></path><rect width="16" height="8" x="4" y="14" rx="2"></rect></svg>`;
	const iconClosed = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 18 4 4 4-4"></path><path d="M12 22V12"></path><rect width="16" height="8" x="4" y="2" rx="2"></rect></svg>`;
	const iconTipoProyecto = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>`;
	const iconCalendar = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
</script>

<div class="project-dashboard">
	{#if loading}
		<div class="loading-container">
			<div class="loader" />
			<p>Cargando datos del dashboard...</p>
		</div>
	{:else if error}
		<div class="error-container">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="48"
				height="48"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<circle cx="12" cy="12" r="10" />
				<line x1="12" y1="8" x2="12" y2="12" />
				<line x1="12" y1="16" x2="12.01" y2="16" />
			</svg>
			<p>{error}</p>
			<button on:click={cargarDatos}>Intentar de nuevo</button>
		</div>
	{:else}
		<div class="tabs">
			<button
				class="tab-btn"
				class:active={activeTab === 'general'}
				on:click={() => (activeTab = 'general')}
			>
				General
			</button>
			<button
				class="tab-btn"
				class:active={activeTab === 'facultades'}
				on:click={() => (activeTab = 'facultades')}
			>
				Facultades
			</button>
			<button
				class="tab-btn"
				class:active={activeTab === 'campos'}
				on:click={() => (activeTab = 'campos')}
			>
				Campos
			</button>
			<button
				class="tab-btn"
				class:active={activeTab === 'cronograma'}
				on:click={() => (activeTab = 'cronograma')}
			>
				Cronograma
			</button>
			<button
				class="tab-btn"
				class:active={activeTab === 'proyectos'}
				on:click={() => (activeTab = 'proyectos')}
			>
				Proyectos
			</button>
		</div>

		{#if activeTab === 'general'}
			<div class="dashboard-content" in:fade={{ duration: 300 }}>
				<!-- Estadísticas rápidas -->
				<div class="stats-grid">
					<div in:fly={{ y: 20, duration: 400, delay: 100 }}>
						<StatCard
							colorVarName="--color--primary"
							icon={iconProjects}
							value={estadisticas.totalProyectos}
						/>
						<CardCircularStatus
							title="Total de Proyectos"
							value={estadisticas.totalProyectos}
							size="md"
							status="primary"
							showValueInside={true}
							labelPosition="inside"
							total={estadisticas.totalProyectos}
							opacity={0.2}
						/>
					</div>

					<div in:fly={{ y: 20, duration: 400, delay: 200 }}>
						<StatCard
							value={estadisticas.proyectosActivos}
							colorVarName="--color--callout-accent--success"
							icon={iconActive}
							trend={estadisticas.totalProyectos
								? Math.round((estadisticas.proyectosActivos / estadisticas.totalProyectos) * 100)
								: 0}
							trendText=""
						/>
						<CardCircularStatus
							title="Proyectos Activos"
							value={estadisticas.proyectosActivos}
							size="md"
							status="success"
							showValueInside={true}
							labelPosition="inside"
							total={estadisticas.totalProyectos}
							opacity={0.2}
						/>
					</div>

					<div in:fly={{ y: 20, duration: 400, delay: 300 }}>
						<StatCard
							value={estadisticas.proyectosCerrados}
							colorVarName="--color--callout-accent--warning"
							icon={iconClosed}
							trend={estadisticas.totalProyectos
								? Math.round((estadisticas.proyectosCerrados / estadisticas.totalProyectos) * 100)
								: 0}
							trendText=""
						/>
						<CardCircularStatus
							title="Proyectos Cerrados"
							value={estadisticas.proyectosCerrados}
							size="md"
							status="warning"
							showValueInside={true}
							labelPosition="inside"
							total={estadisticas.totalProyectos}
							opacity={0.2}
						/>
					</div>
					<div in:fly={{ y: 20, duration: 400, delay: 400 }}>
						<StatCard
							title="Tipo de Proyecto Principal"
							value={estadisticas.proyectosPorTipoPrincipal.tipo}
							colorVarName="--color--secondary"
							icon={iconTipoProyecto}
							trend={estadisticas.totalProyectos
								? Math.round(
										(estadisticas.proyectosPorTipoPrincipal.cantidad /
											estadisticas.totalProyectos) *
											100
								  )
								: 0}
							trendText={`${estadisticas.proyectosPorTipoPrincipal.cantidad} proyectos`}
						/>
					</div>
				</div>

				<div class="charts-grid-2">
					<!-- Estado de proyectos -->
					<div class="chart-container" in:fly={{ y: 30, duration: 400, delay: 300 }}>
						<DonutChart
							data={estadoChartData}
							title="Estado de Proyectos"
							width={300}
							height={300}
							showLabels={true}
						/>
					</div>

					<!-- Alcance territorial -->
					<div class="chart-container" in:fly={{ y: 30, duration: 400, delay: 400 }}>
						<HorizontalBarChart
							data={alcanceChartData}
							title="Alcance Territorial"
							height={300}
							width={width < 768 ? width - 60 : 600}
							marginLeft={150}
							marginRight={120}
							marginTop={20}
							marginBottom={40}
							barHeight={35}
							yLabel="Tipo de Alcance"
							showPercentage={true}
						/>
					</div>
				</div>

				<!-- Resumen de Cronología -->
				<div class="chart-container full-width" in:fly={{ y: 30, duration: 400, delay: 500 }}>
					<div class="timeline-summary">
						<div class="timeline-summary__header">
							<h3>Resumen de Cronología</h3>
							<div class="timeline-summary__icon">
								{@html iconCalendar}
							</div>
						</div>
						<div class="timeline-summary__content">
							<div class="timeline-stat">
								<div class="timeline-stat__label">Proyectos más recientes:</div>
								<div class="timeline-stat__value">
									{#if proyectos.length > 0}
										{proyectos
											.sort((a, b) => {
												const dateA = a.fecha_inicio.split('/').reverse().join('');
												const dateB = b.fecha_inicio.split('/').reverse().join('');
												return dateB.localeCompare(dateA);
											})
											.slice(0, 1)[0].titulo}
									{:else}
										-
									{/if}
								</div>
							</div>
							<div class="timeline-stat">
								<div class="timeline-stat__label">Proyectos por finalizar:</div>
								<div class="timeline-stat__value">
									{proyectos.filter((p) => p.estado === 'En cierre').length} proyectos
									<CardCircularStatus
										title="Proyectos por Finalizar"
										value={proyectos.filter((p) => p.estado === 'En cierre').length}
										total={estadisticas.totalProyectos}
										size="md"
										status="primary"
										showValueInside={true}
										labelPosition="inside"
										opacity={0.2}
									/>
								</div>
							</div>

							<button class="timeline-summary__link" on:click={() => (activeTab = 'cronograma')}>
								Ver cronograma completo
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
									<line x1="5" y1="12" x2="19" y2="12" />
									<polyline points="12 5 19 12 12 19" />
								</svg>
							</button>
						</div>
					</div>
				</div>
				<!-- El gráfico de Fuentes de Financiamiento ha sido eliminado -->
			</div>
		{:else if activeTab === 'facultades'}
			<div class="dashboard-content" in:fade={{ duration: 300 }}>
				<div class="chart-container full-width" in:fly={{ y: 30, duration: 400, delay: 200 }}>
					<BarChart
						data={facultadChartData}
						title="Proyectos por Facultad/Entidad"
						height={500}
						marginBottom={120}
						xRotate={-45}
						yLabel="Proyectos"
						showHorizontal={true}
						itemsPerPage={10}
						showSearch={true}
					/>
				</div>
			</div>
		{:else if activeTab === 'campos'}
			<div class="dashboard-content" in:fade={{ duration: 300 }}>
				<div class="chart-container full-width" in:fly={{ y: 30, duration: 400, delay: 200 }}>
					<BarChart
						data={campoChartData}
						title="Proyectos por Campo Amplio"
						height={420}
						marginBottom={120}
						xRotate={-45}
						yLabel="Proyectos"
					/>
				</div>
			</div>
		{:else if activeTab === 'cronograma'}
			<div class="dashboard-content" in:fade={{ duration: 300 }}>
				<div class="chart-container full-width" in:fly={{ y: 30, duration: 400, delay: 200 }}>
					<TimelineChart
						data={timelineData}
						title="Cronograma de Proyectos"
						width={width < 768 ? width - 40 : width - 60}
						height={500}
						marginLeft={200}
					/>
				</div>
			</div>
		{:else if activeTab === 'proyectos'}
			<div class="dashboard-content" in:fade={{ duration: 300 }}>
				<div class="full-width" in:fly={{ y: 30, duration: 400, delay: 200 }}>
					<ProjectsTable projects={proyectos} itemsPerPage={10} />
				</div>
			</div>
		{/if}
	{/if}
</div>

<style lang="scss">
	@import '$lib/scss/_breakpoints.scss';

	.project-dashboard {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		color: var(--color--text);
	}

	.loading-container,
	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		background: var(--color--card-background);
		border-radius: 12px;
		box-shadow: var(--card-shadow);

		p {
			margin-bottom: 1.5rem;
			color: var(--color--text-shade);
			font-size: 1.1rem;
		}
	}

	.error-container {
		svg {
			margin-bottom: 1rem;
			color: var(--color--callout-accent--error);
		}

		button {
			padding: 0.75rem 1.5rem;
			background: var(--color--primary);
			color: white;
			border: none;
			border-radius: 8px;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;

			&:hover {
				filter: brightness(1.1);
				transform: translateY(-2px);
			}
		}
	}

	.loader {
		border: 4px solid color-mix(in srgb, var(--color--primary) 30%, transparent);
		border-radius: 50%;
		border-top: 4px solid var(--color--primary);
		width: 50px;
		height: 50px;
		animation: spin 1s linear infinite;
		margin-bottom: 1.5rem;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.tabs {
		display: flex;
		border-bottom: 1px solid color-mix(in srgb, var(--color--text) 20%, transparent);
		margin-bottom: 1rem;
		overflow-x: auto;
		scrollbar-width: thin;

		&::-webkit-scrollbar {
			height: 3px;
		}

		&::-webkit-scrollbar-thumb {
			background: var(--color--primary-shade);
			border-radius: 10px;
		}
	}

	.tab-btn {
		padding: 0.75rem 1.25rem;
		background: transparent;
		border: none;
		border-bottom: 3px solid transparent;
		color: var(--color--text-shade);
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 1rem;
		white-space: nowrap;

		&:hover {
			color: var(--color--text);
			background: color-mix(in srgb, var(--color--primary) 5%, transparent);
		}

		&.active {
			color: var(--color--primary);
			border-bottom: 3px solid var(--color--primary);
		}
	}

	.dashboard-content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr); /* Fuerza exactamente 4 columnas de igual tamaño */
		gap: 1.25rem;

		@include for-tablet-portrait-down {
			grid-template-columns: repeat(2, 1fr); /* 2 columnas en tablets */
		}

		@include for-phone-only {
			grid-template-columns: 1fr; /* 1 columna en móviles */
		}

		/* Asegura que cada elemento de la grid tenga la misma altura */
		> div {
			height: 100%;
			display: flex; /* Para asegurar que el StatCard ocupe todo el espacio disponible */

			:global(.stat-card) {
				flex: 1; /* Hace que la tarjeta ocupe todo el espacio disponible */
				display: flex;
				flex-direction: column;
			}

			:global(.stat-card__content) {
				flex: 1; /* Hace que el contenido ocupe todo el espacio vertical disponible */
				display: flex;
				flex-direction: column;
			}
		}
	}

	.charts-grid-2 {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
		gap: 1.5rem;

		@include for-tablet-portrait-down {
			grid-template-columns: 1fr;
		}
	}

	.chart-container {
		width: 100%;
		background: var(--color--card-background);
		border-radius: 12px;
		overflow: hidden;

		&.full-width {
			grid-column: 1 / -1;
		}
	}

	.full-width {
		width: 100%;
	}

	.timeline-summary {
		padding: 1.5rem;

		&__header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 1.5rem;
			padding-bottom: 0.75rem;
			border-bottom: 1px solid color-mix(in srgb, var(--color--text) 10%, transparent);

			h3 {
				font-size: 1.25rem;
				font-weight: 700;
				color: var(--color--text);
				margin: 0;
			}
		}

		&__icon {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 3rem;
			height: 3rem;
			border-radius: 50%;
			background: color-mix(in srgb, var(--color--primary) 15%, transparent);
			color: var(--color--primary);
		}

		&__content {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
			gap: 1.5rem;

			@include for-phone-only {
				grid-template-columns: 1fr;
			}
		}

		&__link {
			grid-column: 1 / -1;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 0.5rem;
			margin-top: 1rem;
			padding: 0.75rem 1rem;
			background: color-mix(in srgb, var(--color--primary) 15%, transparent);
			color: var(--color--primary);
			border-radius: 8px;
			font-weight: 600;
			font-family: inherit;
			text-decoration: none;
			transition: all 0.2s ease;
			border: none;
			cursor: pointer;
			font-size: 1rem;

			&:hover {
				background: color-mix(in srgb, var(--color--primary) 25%, transparent);
				transform: translateY(-2px);
			}

			&:focus-visible {
				outline: 2px solid var(--color--primary);
				outline-offset: 2px;
			}

			svg {
				transition: transform 0.3s ease;
			}

			&:hover svg {
				transform: translateX(4px);
			}
		}
	}

	.timeline-stat {
		background: color-mix(in srgb, var(--color--card-background) 75%, transparent);
		border: 1px solid color-mix(in srgb, var(--color--text) 10%, transparent);
		border-radius: 8px;
		padding: 1rem;

		&__label {
			font-size: 0.9rem;
			color: var(--color--text-shade);
			margin-bottom: 0.5rem;
		}

		&__value {
			font-size: 1.1rem;
			font-weight: 600;
			color: var(--color--text);
		}
	}
</style>
