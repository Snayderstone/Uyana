<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import ChartRenderer from '$lib/components/admin/ChartRenderer.svelte';
	import ExportPDFModal from '$lib/components/admin/ExportPDFModal.svelte';
	import type { GraficoConfig } from '$lib/models/admin';
	import { type DashboardData } from '$lib/utils/chartConfigs';
	import { chartGenerators } from '$lib/utils/optimizedChartConfigs';

	// ==========================================
	// CACHE CONFIGURATION
	// ==========================================
	const CACHE_DURATION = 24 * 60 * 60 * 1000;
	const POLL_INTERVAL = 30000;
	const CACHE_VERSION = 'v3';

	const CACHE_KEYS = {
		data: `dashboard_data_${CACHE_VERSION}`,
		timestamp: `dashboard_timestamp_${CACHE_VERSION}`,
		hash: `dashboard_hash_${CACHE_VERSION}`,
		chartConfigs: `chart_configs_${CACHE_VERSION}`
	};

	// ==========================================
	// STATE MANAGEMENT
	// ==========================================
	let loading = true;
	let error: string | null = null;
	let lastUpdate = '';
	let isFetchingUpdate = false;
	let showExportModal = false;
	let showConfirmModal = false;
	let chartToToggle: string | null = null;
	let activeTab: 'indices' | 'basicas' | 'avanzadas' = 'indices';

	// Chart configurations from database
	let chartConfigs: GraficoConfig[] = [];
	let visibleCharts: Record<string, boolean> = {};

	// Dashboard data
	let dashboardData: DashboardData = {
		stats: {
			total_projects: 0,
			total_budget: 0,
			completed_count: 0,
			in_progress_count: 0
		},
		projects: []
	};

	let pollInterval: number | undefined;

	// Chart refs for export
	let chartRefs: Record<string, any> = {};

	// Available charts for export - solo gráficos de la pestaña Básicas
	$: chartsBasicasForExport = chartConfigs.map((config) => ({
		id: config.nombre_grafico,
		name: config.nombre_grafico,
		title: config.titulo_display,
		category: 'basicas'
	}));

	// Charts para Índices (vacío por ahora, pero preparado para el futuro)
	let chartsIndicesForExport: Array<{
		id: string;
		name: string;
		title: string;
		category: string;
	}> = [];

	// Charts para Avanzadas (vacío por ahora, pero preparado para el futuro)
	let chartsAvanzadasForExport: Array<{
		id: string;
		name: string;
		title: string;
		category: string;
	}> = [];

	// ==========================================
	// COMPUTED STATS
	// ==========================================
	$: completionRate =
		dashboardData.stats.total_projects > 0
			? ((dashboardData.stats.completed_count / dashboardData.stats.total_projects) * 100).toFixed(
					1
			  )
			: '0';

	$: averageBudget =
		dashboardData.stats.total_projects > 0
			? dashboardData.stats.total_budget / dashboardData.stats.total_projects
			: 0;

	$: activeProjects = dashboardData.stats.total_projects - dashboardData.stats.completed_count;

	// ==========================================
	// FORMATTING UTILITIES
	// ==========================================
	function formatCompactNumber(value: number): { short: string; full: string } {
		const fullFormatted = formatCurrency(value);

		if (value >= 1000000) {
			const millions = (value / 1000000).toFixed(1);
			return {
				short: `${millions}M US$`,
				full: fullFormatted
			};
		} else if (value >= 1000) {
			const thousands = (value / 1000).toFixed(1);
			return {
				short: `${thousands}K US$`,
				full: fullFormatted
			};
		}

		return {
			short: fullFormatted,
			full: fullFormatted
		};
	}

	// ==========================================
	// CACHE UTILITIES
	// ==========================================
	function generateDataHash(stats: any): string {
		return JSON.stringify({
			count: stats.total_projects,
			totalBudget: stats.total_budget,
			completed: stats.completed_count
		});
	}

	function loadFromCache(): boolean {
		if (!browser) return false;

		try {
			const cached = localStorage.getItem(CACHE_KEYS.data);
			const timestamp = localStorage.getItem(CACHE_KEYS.timestamp);
			const cachedConfigs = localStorage.getItem(CACHE_KEYS.chartConfigs);

			if (!cached || !timestamp) return false;

			const age = Date.now() - parseInt(timestamp);
			if (age > CACHE_DURATION) {
				clearCache();
				return false;
			}

			dashboardData = JSON.parse(cached);
			if (cachedConfigs) {
				chartConfigs = JSON.parse(cachedConfigs);
				chartConfigs.forEach((config) => {
					visibleCharts[config.nombre_grafico] = true;
				});
			}
			lastUpdate = new Date(parseInt(timestamp)).toLocaleString('es-ES');
			return true;
		} catch (err) {
			console.error('Error loading from cache:', err);
			clearCache();
			return false;
		}
	}

	function saveToCache(data: DashboardData, configs: GraficoConfig[]): void {
		if (!browser) return;

		try {
			const timestamp = Date.now().toString();
			const hash = generateDataHash(data.stats);

			localStorage.setItem(CACHE_KEYS.data, JSON.stringify(data));
			localStorage.setItem(CACHE_KEYS.timestamp, timestamp);
			localStorage.setItem(CACHE_KEYS.hash, hash);
			localStorage.setItem(CACHE_KEYS.chartConfigs, JSON.stringify(configs));

			lastUpdate = new Date(parseInt(timestamp)).toLocaleString('es-ES');
		} catch (err) {
			console.error('Error saving to cache:', err);
		}
	}

	function clearCache(): void {
		if (!browser) return;
		Object.values(CACHE_KEYS).forEach((key) => localStorage.removeItem(key));
	}

	// ==========================================
	// DATA FETCHING
	// ==========================================
	async function fetchDashboardData(silent = false): Promise<void> {
		if (!silent) loading = true;
		error = null;

		try {
			// Fetch analytics data (uses materialized views)
			const [analyticsRes, chartsRes] = await Promise.all([
				fetch('/api/admin/analytics'),
				fetch('/api/admin/charts')
			]);

			if (!analyticsRes.ok || !chartsRes.ok) {
				throw new Error('Error fetching data');
			}

			const analyticsData = await analyticsRes.json();
			const chartsData = await chartsRes.json();

			if (!analyticsData.success) {
				throw new Error(analyticsData.message || 'Error fetching analytics');
			}

			// Check if data has changed
			const newHash = generateDataHash(analyticsData.data.resumen);
			const cachedHash = browser ? localStorage.getItem(CACHE_KEYS.hash) : null;

			if (cachedHash && newHash === cachedHash && silent) {
				return;
			}

			// Transform analytics data to dashboard format
			dashboardData = {
				stats: {
					total_projects: analyticsData.data.resumen.total_proyectos || 0,
					total_budget: analyticsData.data.resumen.presupuesto_total || 0,
					completed_count: analyticsData.data.resumen.proyectos_finalizados || 0,
					in_progress_count: analyticsData.data.resumen.proyectos_en_ejecucion || 0
				},
				projects: [], // No longer needed, using materialized views
				analytics: analyticsData.data // Store full analytics data
			};

			chartConfigs = chartsData.success ? chartsData.data : [];
			chartConfigs.forEach((config) => {
				visibleCharts[config.nombre_grafico] = true;
			});

			saveToCache(dashboardData, chartConfigs);
		} catch (err) {
			console.error('Error fetching dashboard:', err);
			error = err instanceof Error ? err.message : 'Error al cargar el dashboard';

			if (silent && dashboardData.stats.total_projects > 0) {
				error = null;
			}
		} finally {
			loading = false;
			isFetchingUpdate = false;
		}
	}

	function requestTogglePublic(chartName: string): void {
		chartToToggle = chartName;
		showConfirmModal = true;
	}

	async function confirmTogglePublic(): Promise<void> {
		if (!chartToToggle) return;

		try {
			const response = await fetch(`/api/admin/charts/${chartToToggle}/toggle-public`, {
				method: 'POST'
			});

			if (!response.ok) throw new Error('Error updating chart visibility');

			const result = await response.json();
			if (result.success) {
				// Update local config
				chartConfigs = chartConfigs.map((c) =>
					c.nombre_grafico === chartToToggle ? { ...c, es_publico: result.data.es_publico } : c
				);
				saveToCache(dashboardData, chartConfigs);
			}
		} catch (err) {
			console.error('Error toggling visibility:', err);
			alert('Error al actualizar la visibilidad del gráfico');
		} finally {
			showConfirmModal = false;
			chartToToggle = null;
		}
	}

	async function checkForUpdates(): Promise<void> {
		if (loading || isFetchingUpdate) return;
		isFetchingUpdate = true;
		await fetchDashboardData(true);
	}

	function startPolling(): void {
		if (!browser) return;
		pollInterval = window.setInterval(checkForUpdates, POLL_INTERVAL);
	}

	function stopPolling(): void {
		if (pollInterval) {
			clearInterval(pollInterval);
			pollInterval = undefined;
		}
	}

	// ==========================================
	// CHART UTILITIES
	// ==========================================
	function toggleChart(chartName: string): void {
		visibleCharts[chartName] = !visibleCharts[chartName];
		visibleCharts = visibleCharts;
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('es-ES', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	function getChartConfig(chartName: string) {
		// Use optimized chart generators with materialized views
		const generator = chartGenerators[chartName];
		if (generator) {
			return generator(dashboardData);
		}
		return null;
	}

	// ==========================================
	// LIFECYCLE
	// ==========================================
	onMount(async () => {
		const hasCache = loadFromCache();

		if (hasCache) {
			loading = false;
			fetchDashboardData(true);
		} else {
			await fetchDashboardData(false);
		}

		startPolling();
	});

	onDestroy(() => {
		stopPolling();
	});
</script>

<svelte:head>
	<title>Dashboard - Proyectos de Investigación</title>
</svelte:head>

<div class="dashboard-container">
	<!-- Header -->
	<div class="dashboard-header">
		<div class="header-title">
			<h1>Dashboard de Proyectos</h1>
			{#if lastUpdate}
				<p class="last-update">Última actualización: {lastUpdate}</p>
			{/if}
		</div>
		<div class="header-actions" />
	</div>

	<!-- Tabs Navigation -->
	<div class="tabs-navigation">
		<button
			class="tab-btn"
			class:active={activeTab === 'indices'}
			on:click={() => (activeTab = 'indices')}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<rect x="3" y="3" width="7" height="7" />
				<rect x="14" y="3" width="7" height="7" />
				<rect x="14" y="14" width="7" height="7" />
				<rect x="3" y="14" width="7" height="7" />
			</svg>
			Índices Generales
		</button>
		<button
			class="tab-btn"
			class:active={activeTab === 'basicas'}
			on:click={() => (activeTab = 'basicas')}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<line x1="12" y1="20" x2="12" y2="10" />
				<line x1="18" y1="20" x2="18" y2="4" />
				<line x1="6" y1="20" x2="6" y2="16" />
			</svg>
			Estadísticas Básicas de Proyectos
		</button>
		<button
			class="tab-btn"
			class:active={activeTab === 'avanzadas'}
			on:click={() => (activeTab = 'avanzadas')}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<path d="M3 3v18h18" />
				<path d="m19 9-5 5-4-4-3 3" />
			</svg>
			Estadísticas Avanzadas de Proyectos
		</button>
	</div>

	{#if error && !loading}
		<div class="error-message">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<circle cx="12" cy="12" r="10" />
				<line x1="12" y1="8" x2="12" y2="12" />
				<line x1="12" y1="16" x2="12.01" y2="16" />
			</svg>
			<span>{error}</span>
		</div>
	{/if}

	{#if loading && dashboardData.stats.total_projects === 0}
		<div class="loading-state">
			<div class="spinner" />
			<p>Cargando dashboard...</p>
		</div>
	{:else}
		<!-- Tab Content: Índices Generales -->
		{#if activeTab === 'indices'}
			<div class="tab-content">
				<div class="stats-grid">
					<!-- Total Proyectos -->
					<div class="stat-card">
						<div class="stat-icon projects">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
								<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
							</svg>
						</div>
						<div class="stat-content">
							<p class="stat-label">Total Proyectos</p>
							<p class="stat-value">{dashboardData.stats.total_projects.toLocaleString()}</p>
						</div>
					</div>

					<!-- Presupuesto Total con Tooltip -->
					<div class="stat-card">
						<div class="stat-icon budget">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<line x1="12" y1="1" x2="12" y2="23" />
								<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
							</svg>
						</div>
						<div class="stat-content">
							<p class="stat-label">Presupuesto Total</p>
							<div
								class="stat-value-wrapper"
								title={formatCompactNumber(dashboardData.stats.total_budget).full}
							>
								<p class="stat-value budget-value">
									{formatCompactNumber(dashboardData.stats.total_budget).short}
								</p>
							</div>
						</div>
					</div>

					<!-- Promedio por Proyecto -->
					<div class="stat-card">
						<div class="stat-icon average">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
							</svg>
						</div>
						<div class="stat-content">
							<p class="stat-label">Promedio por Proyecto</p>
							<div class="stat-value-wrapper" title={formatCompactNumber(averageBudget).full}>
								<p class="stat-value budget-value">
									{formatCompactNumber(averageBudget).short}
								</p>
							</div>
						</div>
					</div>

					<!-- Proyectos Activos -->
					<div class="stat-card">
						<div class="stat-icon active">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<circle cx="12" cy="12" r="10" />
								<polyline points="12 6 12 12 16 14" />
							</svg>
						</div>
						<div class="stat-content">
							<p class="stat-label">Proyectos Activos</p>
							<p class="stat-value">{activeProjects.toLocaleString()}</p>
						</div>
					</div>

					<!-- Completados -->
					<div class="stat-card">
						<div class="stat-icon completed">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
								<polyline points="22 4 12 14.01 9 11.01" />
							</svg>
						</div>
						<div class="stat-content">
							<p class="stat-label">Completados</p>
							<p class="stat-value">{dashboardData.stats.completed_count}</p>
						</div>
					</div>

					<!-- En Progreso -->
					<div class="stat-card">
						<div class="stat-icon progress">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
							</svg>
						</div>
						<div class="stat-content">
							<p class="stat-label">En Progreso</p>
							<p class="stat-value">{dashboardData.stats.in_progress_count}</p>
						</div>
					</div>

					<!-- Tasa de Finalización -->
					<div class="stat-card">
						<div class="stat-icon success-rate">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M22 12h-4l-3 9L9 3l-3 9H2" />
							</svg>
						</div>
						<div class="stat-content">
							<p class="stat-label">Tasa de Finalización</p>
							<p class="stat-value">{completionRate}%</p>
						</div>
					</div>

					<!-- Pendientes -->
					<div class="stat-card">
						<div class="stat-icon pending">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<circle cx="12" cy="12" r="10" />
								<polyline points="8 12 12 16 16 12" />
								<line x1="12" y1="8" x2="12" y2="16" />
							</svg>
						</div>
						<div class="stat-content">
							<p class="stat-label">Pendientes</p>
							<p class="stat-value">
								{dashboardData.stats.total_projects -
									dashboardData.stats.completed_count -
									dashboardData.stats.in_progress_count}
							</p>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Tab Content: Estadísticas Básicas -->
		{#if activeTab === 'basicas'}
			<div class="tab-content">
				<div class="section-header">
					<div class="section-header-content">
						<h2>Estadísticas Básicas de Proyectos</h2>
						<p class="section-description">
							Análisis completo basado en vistas materializadas con datos pre-calculados para máximo
							rendimiento
						</p>
					</div>
					<div class="section-actions">
						<button
							class="action-btn refresh-btn"
							on:click={() => fetchDashboardData(false)}
							disabled={loading}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"
								/>
							</svg>
							{loading ? 'Actualizando...' : 'Actualizar'}
						</button>
						<button
							class="action-btn export-btn"
							on:click={() => (showExportModal = true)}
							disabled={loading || chartsBasicasForExport.length === 0}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
								<polyline points="7 10 12 15 17 10" />
								<line x1="12" y1="15" x2="12" y2="3" />
							</svg>
							Exportar Gráficos
						</button>
					</div>
				</div>

				<!-- Charts Grid -->
				<div class="charts-grid">
					{#each chartConfigs as config (config.nombre_grafico)}
						{@const chartConfig = getChartConfig(config.nombre_grafico)}
						{@const isVisible = visibleCharts[config.nombre_grafico]}
						{@const isPublic = config.es_publico}

						<div
							class="chart-card"
							class:collapsed={!isVisible}
							class:wide={config.nombre_grafico === 'geoMap'}
							id="chart-container-{config.nombre_grafico}"
						>
							<div class="chart-header">
								<h3>{config.titulo_display}</h3>
								<div class="chart-actions">
									<button
										class="action-icon-btn"
										class:public={isPublic}
										on:click={() => requestTogglePublic(config.nombre_grafico)}
										title={isPublic ? 'Público' : 'Privado'}
									>
										{#if isPublic}
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="18"
												height="18"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
											>
												<circle cx="12" cy="12" r="10" />
												<line x1="2" y1="12" x2="22" y2="12" />
												<path
													d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
												/>
											</svg>
										{:else}
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="18"
												height="18"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
											>
												<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
												<path d="M7 11V7a5 5 0 0 1 10 0v4" />
											</svg>
										{/if}
									</button>
									<button
										class="action-icon-btn"
										on:click={() => toggleChart(config.nombre_grafico)}
										title={isVisible ? 'Ocultar' : 'Mostrar'}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="18"
											height="18"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
										>
											{#if isVisible}
												<polyline points="18 15 12 9 6 15" />
											{:else}
												<polyline points="6 9 12 15 18 9" />
											{/if}
										</svg>
									</button>
								</div>
							</div>

							{#if isVisible && chartConfig}
								<div class="chart-body">
									<ChartRenderer
										chartId="chart-{config.nombre_grafico}"
										config={chartConfig}
										height={config.nombre_grafico === 'geoMap' ? 400 : 350}
										bind:this={chartRefs[config.nombre_grafico]}
									/>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Tab Content: Estadísticas Avanzadas -->
		{#if activeTab === 'avanzadas'}
			<div class="tab-content">
				<div class="section-header">
					<h2>Estadísticas Avanzadas de Proyectos</h2>
					<p class="section-description">
						Análisis avanzado y correlaciones entre variables (próximamente)
					</p>
				</div>

				<div class="empty-state">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="64"
						height="64"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
					>
						<circle cx="12" cy="12" r="10" />
						<line x1="12" y1="16" x2="12" y2="12" />
						<line x1="12" y1="8" x2="12.01" y2="8" />
					</svg>
					<h3>Estadísticas Avanzadas</h3>
					<p>
						Esta sección estará disponible próximamente con análisis predictivo, correlaciones y
						tendencias avanzadas.
					</p>
				</div>
			</div>
		{/if}
	{/if}
</div>

<!-- Export Modal -->
<ExportPDFModal bind:isOpen={showExportModal} availableCharts={chartsBasicasForExport} />

<!-- Confirmation Modal -->
{#if showConfirmModal}
	<div
		class="modal-overlay"
		on:click={() => (showConfirmModal = false)}
		on:keydown={(e) => e.key === 'Escape' && (showConfirmModal = false)}
		role="dialog"
		aria-modal="true"
	>
		<div class="modal-content" on:click|stopPropagation on:keydown|stopPropagation>
			<div class="modal-header">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="48"
					height="48"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					class="warning-icon"
				>
					<path
						d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
					/>
					<line x1="12" y1="9" x2="12" y2="13" />
					<line x1="12" y1="17" x2="12.01" y2="17" />
				</svg>
				<h3>Confirmar cambio de visibilidad</h3>
			</div>
			<div class="modal-body">
				<p>¿Estás seguro de que deseas cambiar la visibilidad pública de este gráfico?</p>
				<p class="modal-warning">
					Esto hará que el gráfico <strong>
						{chartConfigs.find((c) => c.nombre_grafico === chartToToggle)?.es_publico
							? 'deje de estar'
							: 'esté'}
					</strong> disponible públicamente.
				</p>
			</div>
			<div class="modal-actions">
				<button class="btn-cancel" on:click={() => (showConfirmModal = false)}>Cancelar</button>
				<button class="btn-confirm" on:click={confirmTogglePublic}>Confirmar</button>
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	.dashboard-container {
		padding: 2rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	.dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.dashboard-header h1 {
		font-size: 2rem;
		font-weight: 700;
		color: #1a1a1a;
		margin: 0;
	}

	.last-update {
		color: #666;
		font-size: 0.875rem;
		margin-top: 0.5rem;
	}

	.header-actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1.25rem;
		border: none;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.export-btn {
		background: #10b981;
		color: white;
	}

	.export-btn:hover:not(:disabled) {
		background: #059669;
		transform: translateY(-1px);
	}

	.refresh-btn {
		background: #3b82f6;
		color: white;
	}

	.refresh-btn:hover:not(:disabled) {
		background: #2563eb;
		transform: translateY(-1px);
	}

	.action-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.error-message {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 8px;
		color: #dc2626;
		margin-bottom: 1.5rem;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		gap: 1rem;
	}

	.spinner {
		width: 48px;
		height: 48px;
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

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		transition: all 0.2s;
	}

	.stat-card:hover {
		border-color: #3b82f6;
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
		transform: translateY(-2px);
	}

	.stat-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		border-radius: 12px;
		flex-shrink: 0;
	}

	.stat-icon.projects {
		background: #dbeafe;
		color: #3b82f6;
	}

	.stat-icon.budget {
		background: #dcfce7;
		color: #16a34a;
	}

	.stat-icon.completed {
		background: #f0fdf4;
		color: #059669;
	}

	.stat-icon.progress {
		background: #fef3c7;
		color: #f59e0b;
	}

	.stat-content {
		flex: 1;
	}

	.stat-label {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0 0 0.25rem 0;
	}

	.stat-value {
		font-size: 1.75rem;
		font-weight: 700;
		color: #1a1a1a;
		margin: 0;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 2rem;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid #e5e7eb;
	}

	.section-header-content {
		flex: 1;
	}

	.section-actions {
		display: flex;
		gap: 0.75rem;
		flex-shrink: 0;
	}

	.section-header h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1a1a1a;
		margin: 0 0 0.5rem 0;
	}

	.section-description {
		color: #6b7280;
		font-size: 0.875rem;
		margin: 0;
	}

	.charts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
		gap: 2rem;
		min-height: 400px;
	}

	.chart-card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		overflow: hidden;
		transition: all 0.2s;
	}

	.chart-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
	}

	.chart-card.wide {
		grid-column: 1 / -1;
	}

	.chart-card.collapsed {
		background: #f9fafb;
	}

	.chart-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.chart-card.collapsed .chart-header {
		border-bottom: none;
	}

	.chart-header h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1a1a1a;
		margin: 0;
	}

	.chart-actions {
		display: flex;
		gap: 0.5rem;
	}

	.action-icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		padding: 0;
		background: #f3f4f6;
		border: none;
		border-radius: 6px;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.2s;
	}

	.action-icon-btn:hover {
		background: #e5e7eb;
		color: #374151;
	}

	.action-icon-btn.public {
		background: #dcfce7;
		color: #059669;
	}

	.action-icon-btn.public:hover {
		background: #bbf7d0;
	}

	.chart-body {
		padding: 1.5rem;
	}

	@media (max-width: 1024px) {
		.charts-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 768px) {
		.dashboard-container {
			padding: 1rem;
		}

		.dashboard-header {
			flex-direction: column;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}

		.charts-grid {
			grid-template-columns: 1fr;
		}
	}
	/* ========== DASHBOARD CONTAINER ========== */
	.dashboard-container {
		padding: 2rem;
		max-width: 100%;
		margin: 0 auto;
	}

	/* ========== HEADER ========== */
	.dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
		gap: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);
	}

	.header-title h1 {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color--text);
		margin: 0 0 0.25rem 0;
		font-family: var(--font--default);
	}

	.last-update {
		font-size: 0.8rem;
		color: var(--color--text-shade);
		margin: 0;
		font-family: var(--font--default);
	}

	.header-actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 600;
		border: none;
		cursor: pointer;
		transition: all 0.3s var(--ease-out-3);
		font-family: var(--font--default);
	}

	.export-btn {
		background: #10b981;
		color: white;
	}

	.export-btn:hover:not(:disabled) {
		background: #059669;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
	}

	.refresh-btn {
		background: var(--color--primary);
		color: var(--color--text-inverse);
	}

	.refresh-btn:hover:not(:disabled) {
		background: var(--color--primary-shade);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(110, 41, 231, 0.3);
	}

	.action-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	/* ========== TABS NAVIGATION ========== */
	.tabs-navigation {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 2rem;
		border-bottom: 2px solid rgba(var(--color--text-rgb), 0.08);
		overflow-x: auto;
	}

	.tab-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		background: transparent;
		border: none;
		border-bottom: 3px solid transparent;
		color: var(--color--text-shade);
		font-size: 0.95rem;
		font-weight: 600;
		font-family: var(--font--default);
		cursor: pointer;
		transition: all 0.3s var(--ease-out-3);
		white-space: nowrap;
		margin-bottom: -2px;
	}

	.tab-btn:hover {
		color: var(--color--primary);
		background: var(--color--primary-tint);
	}

	.tab-btn.active {
		color: var(--color--primary);
		border-bottom-color: var(--color--primary);
		background: var(--color--primary-tint);
	}

	.tab-btn svg {
		flex-shrink: 0;
	}

	/* ========== TAB CONTENT ========== */
	.tab-content {
		animation: fadeIn 0.3s ease-in;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* ========== EMPTY STATE ========== */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		color: var(--color--text-shade);
	}

	.empty-state svg {
		opacity: 0.3;
		margin-bottom: 1.5rem;
	}

	.empty-state h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color--text);
		margin: 0 0 0.75rem 0;
		font-family: var(--font--default);
	}

	.empty-state p {
		font-size: 0.95rem;
		max-width: 500px;
		margin: 0;
		line-height: 1.6;
	}

	/* ========== ERROR & LOADING ========== */
	.error-message {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 8px;
		color: #dc2626;
		margin-bottom: 1.5rem;
		font-family: var(--font--default);
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		gap: 1rem;
	}

	.spinner {
		width: 48px;
		height: 48px;
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

	/* ========== STATS CARDS ========== */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		border-radius: 12px;
		transition: all 0.3s var(--ease-out-3);
	}

	.stat-card:hover {
		border-color: var(--color--primary);
		box-shadow: 0 4px 12px rgba(110, 41, 231, 0.1);
		transform: translateY(-2px);
	}

	.stat-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		border-radius: 12px;
		flex-shrink: 0;
	}

	.stat-icon.projects {
		background: #dbeafe;
		color: #3b82f6;
	}

	.stat-icon.budget {
		background: #dcfce7;
		color: #16a34a;
	}

	.stat-icon.completed {
		background: #f0fdf4;
		color: #059669;
	}

	.stat-icon.progress {
		background: #fef3c7;
		color: #f59e0b;
	}

	.stat-icon.average {
		background: #e0e7ff;
		color: #6366f1;
	}

	.stat-icon.active {
		background: #fce7f3;
		color: #ec4899;
	}

	.stat-icon.success-rate {
		background: #d1fae5;
		color: #10b981;
	}

	.stat-icon.pending {
		background: #fef9c3;
		color: #eab308;
	}

	.stat-content {
		flex: 1;
		min-width: 0;
	}

	.stat-value-wrapper {
		cursor: help;
		position: relative;
	}

	.stat-value-wrapper:hover .stat-value {
		color: var(--color--primary);
	}

	.stat-label {
		font-size: 0.875rem;
		color: var(--color--text-shade);
		margin: 0 0 0.25rem 0;
		font-family: var(--font--default);
		font-weight: 500;
	}

	.stat-value {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color--text);
		margin: 0;
		font-family: var(--font--default);
		word-break: break-word;
	}

	.stat-value.budget-value {
		font-size: 1.4rem;
		line-height: 1.2;
	}

	/* ========== SECTION HEADERS ========== */
	.section-header {
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid rgba(var(--color--text-rgb), 0.08);
	}

	.section-header h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--color--text);
		margin: 0 0 0.5rem 0;
		font-family: var(--font--default);
	}

	.section-description {
		color: var(--color--text-shade);
		font-size: 0.95rem;
		margin: 0;
		line-height: 1.5;
	}

	/* ========== CHARTS GRID ========== */
	.charts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
		gap: 2rem;
		min-height: 400px;
	}

	.chart-card {
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		border-radius: 12px;
		overflow: hidden;
		transition: all 0.3s var(--ease-out-3);
	}

	.chart-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
		border-color: rgba(var(--color--text-rgb), 0.15);
	}

	.chart-card.wide {
		grid-column: 1 / -1;
	}

	.chart-card.collapsed {
		background: rgba(var(--color--text-rgb), 0.02);
	}

	.chart-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);
		background: var(--color--card-background);
	}

	.chart-card.collapsed .chart-header {
		border-bottom: none;
	}

	.chart-header h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color--text);
		margin: 0;
		font-family: var(--font--default);
	}

	.chart-actions {
		display: flex;
		gap: 0.5rem;
	}

	.action-icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		padding: 0;
		background: rgba(var(--color--text-rgb), 0.05);
		border: none;
		border-radius: 6px;
		color: var(--color--text-shade);
		cursor: pointer;
		transition: all 0.2s var(--ease-out-3);
	}

	.action-icon-btn:hover {
		background: rgba(var(--color--text-rgb), 0.1);
		color: var(--color--text);
	}

	.action-icon-btn.public {
		background: #dcfce7;
		color: #059669;
	}

	.action-icon-btn.public:hover {
		background: #bbf7d0;
	}

	.chart-body {
		padding: 1.5rem;
		background: var(--color--card-background);
	}

	/* ========== RESPONSIVE ========== */
	@media (max-width: 1024px) {
		.charts-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 768px) {
		.dashboard-container {
			padding: 1rem;
		}

		.dashboard-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.header-actions {
			width: 100%;
			justify-content: flex-start;
		}

		.action-btn {
			flex: 1;
			min-width: 0;
			justify-content: center;
		}

		.tabs-navigation {
			overflow-x: scroll;
			-webkit-overflow-scrolling: touch;
		}

		.tab-btn {
			font-size: 0.85rem;
			padding: 0.625rem 1rem;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}

		.stat-value {
			font-size: 1.5rem;
		}

		.stat-value.budget-value {
			font-size: 1.25rem;
		}

		.charts-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.section-header {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}

		.section-actions {
			width: 100%;
		}

		.section-actions .action-btn {
			flex: 1;
			min-width: 0;
		}
	}

	/* ========== CONFIRMATION MODAL ========== */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		animation: fadeInModal 0.2s ease-out;
	}

	@keyframes fadeInModal {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal-content {
		background: var(--color--card-background);
		border-radius: 16px;
		padding: 2rem;
		max-width: 480px;
		width: 90%;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.modal-header {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.warning-icon {
		color: #f59e0b;
		margin-bottom: 1rem;
	}

	.modal-header h3 {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color--text);
		margin: 0;
		font-family: var(--font--default);
	}

	.modal-body {
		margin-bottom: 2rem;
	}

	.modal-body p {
		font-size: 1rem;
		color: var(--color--text);
		line-height: 1.6;
		margin: 0 0 1rem 0;
		font-family: var(--font--default);
	}

	.modal-warning {
		background: rgba(245, 158, 11, 0.1);
		padding: 0.75rem 1rem;
		border-radius: 8px;
		border-left: 3px solid #f59e0b;
		font-size: 0.95rem;
		color: var(--color--text-shade);
	}

	.modal-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
	}

	.btn-cancel,
	.btn-confirm {
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-size: 0.95rem;
		font-weight: 600;
		font-family: var(--font--default);
		cursor: pointer;
		transition: all 0.3s var(--ease-out-3);
		border: none;
	}

	.btn-cancel {
		background: var(--color--card-background);
		color: var(--color--text);
		border: 1px solid rgba(var(--color--text-rgb), 0.2);
	}

	.btn-cancel:hover {
		background: rgba(var(--color--text-rgb), 0.05);
		border-color: rgba(var(--color--text-rgb), 0.3);
	}

	.btn-confirm {
		background: var(--color--primary);
		color: var(--color--text-inverse);
	}

	.btn-confirm:hover {
		background: var(--color--primary-shade);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(110, 41, 231, 0.3);
	}
</style>
