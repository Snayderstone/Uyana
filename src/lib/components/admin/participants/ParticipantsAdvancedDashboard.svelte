<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import type { ParticipantsDashboardData, GraficoConfig } from '$lib/models/admin';

	// Components
	import ExportPDFModal from '$lib/components/admin/ExportPDFModal.svelte';
	import VisibilityConfirmModal from '$lib/components/molecules/VisibilityConfirmModal.svelte';
	import { LoadingState, ErrorState } from '$lib/components/atoms';
	import { StatCard, TabNavigation, SectionHeader, PieChart } from '$lib/components/molecules';

	let loading = true;
	let error: string | null = null;
	let lastUpdate = '';
	let dashboardData: ParticipantsDashboardData | null = null;
	let showExportModal = false;
	let showConfirmModal = false;
	let chartToToggle: string | null = null;
	let chartConfigs: GraficoConfig[] = [];
	let visibleCharts: Record<string, boolean> = {};

	// Stats grid configuration
	let statsGridVisible = true;
	let statsGridPublic = false;

	// Visibility state for each chart
	let facultadesVisible = true;
	let carrerasVisible = true;
	let cargosVisible = true;
	let genderPieVisible = true;
	let directivaGeneroVisible = true;
	let facultadGeneroVisible = true;

	// Public/Private status for each chart
	let chartPublicStatus: Record<string, boolean> = {};

	// Avatar por defecto
	const DEFAULT_AVATAR =
		'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%236E29E7"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="white" font-size="40" font-family="Arial, sans-serif" font-weight="bold"%3E👤%3C/text%3E%3C/svg%3E';

	// ==========================================
	// COMPUTED - Available Charts for Export
	// ==========================================

	// Charts disponibles para exportación (sin prefijo 'chart-container-' porque se agrega automáticamente)
	$: availableChartsForExport = [
		// Overview
		{
			id: 'participants-stats-grid',
			name: 'participants-stats-grid',
			title: 'Estadísticas Generales',
			category: 'overview'
		},
		{
			id: 'top-researchers',
			name: 'top-researchers',
			title: 'Top 20 Investigadores',
			category: 'overview'
		},

		// Facultades
		{
			id: 'facultades',
			name: 'facultades',
			title: 'Top 15 Facultades',
			category: 'facultades'
		},

		// Carreras
		{
			id: 'carreras',
			name: 'carreras',
			title: 'Top 20 Carreras',
			category: 'carreras'
		},

		// Cargos
		{ id: 'cargos', name: 'cargos', title: 'Top 10 Cargos', category: 'cargos' },

		// Género
		{
			id: 'gender-pie',
			name: 'gender-pie',
			title: 'Distribución por Género',
			category: 'genero'
		},
		{
			id: 'directiva-genero',
			name: 'directiva-genero',
			title: 'Participación Directiva por Género',
			category: 'genero'
		},
		{
			id: 'facultad-genero',
			name: 'facultad-genero',
			title: 'Facultad × Género',
			category: 'genero'
		}
	];

	// Helper para manejar error de carga de imagen
	function handleImageError(event: Event) {
		const img = event.target as HTMLImageElement;
		if (img) {
			img.src = DEFAULT_AVATAR;
		}
	}

	onMount(async () => {
		// Load stats grid configuration from localStorage
		if (browser) {
			const savedConfig = localStorage.getItem('participants_stats_grid_config');
			if (savedConfig) {
				const config = JSON.parse(savedConfig);
				statsGridVisible = config.visible ?? true;
				statsGridPublic = config.public ?? false;
			}
		}

		await Promise.all([loadDashboardData(), loadChartConfigs()]);
	});

	async function loadDashboardData(silent = false) {
		if (!silent) loading = true;
		error = null;
		try {
			const response = await fetch('/api/admin/participants/dashboard');
			const result = await response.json();

			if (result.success) {
				dashboardData = result.data;
				lastUpdate = new Date().toLocaleString('es-ES');
				if (!silent) console.log('📊 Dashboard data loaded:', dashboardData);
			} else {
				error = result.message || 'Error al cargar datos del dashboard';

				// Verificar si es un error de vistas no configuradas
				if (result.message?.includes('vistas') || result.message?.includes('views')) {
					error =
						'Las vistas materializadas no están configuradas. Consulta database/SETUP_INSTRUCTIONS.md para instrucciones detalladas.';
				}

				// Si es actualización silenciosa y ya hay datos, no mostrar error
				if (silent && dashboardData) {
					error = null;
				}
			}
		} catch (err) {
			console.error('Error loading dashboard:', err);

			if (!silent || !dashboardData) {
				error =
					'Error al cargar datos del dashboard. Verifica que las vistas estén creadas. Consulta database/SETUP_INSTRUCTIONS.md';
			}
		} finally {
			loading = false;
		}
	}

	async function loadChartConfigs() {
		try {
			const response = await fetch('/api/admin/graficosConfig?category=participantes');
			const result = await response.json();

			if (result.success) {
				chartConfigs = result.data;
				// Initialize visibility for all charts
				chartConfigs.forEach((config) => {
					visibleCharts[config.nombre_grafico] = true;
				});
			}
		} catch (err) {
			console.error('Error loading chart configs:', err);
		}
	}

	async function refreshViews() {
		loading = true;
		error = null;
		try {
			console.log('🔄 Refrescando vistas materializadas...');
			const response = await fetch('/api/admin/participants/refresh', { method: 'POST' });

			if (!response.ok) {
				const result = await response.json();
				console.error('❌ Error del servidor:', result);

				if (
					result.details &&
					result.details.includes('function refresh_participantes_stats() does not exist')
				) {
					error =
						'Las vistas materializadas no están configuradas. Por favor, ejecuta el script database/views_participantes.sql en tu base de datos.';
				} else {
					error =
						result.message ||
						'Error al refrescar vistas. Verifica que las vistas materializadas estén configuradas.';
				}
				return;
			}

			const result = await response.json();

			if (result.success) {
				console.log('✅ Vistas refrescadas correctamente');
				await loadDashboardData();
				alert('✅ Dashboard actualizado correctamente');
			} else {
				error = result.message || 'Error al refrescar vistas';
			}
		} catch (err) {
			console.error('❌ Error al refrescar vistas:', err);
			error = 'Error de conexión al refrescar vistas. Verifica que el servidor esté activo.';
		} finally {
			loading = false;
		}
	}

	function requestTogglePublic(chartName: string): void {
		chartToToggle = chartName;
		showConfirmModal = true;
	}

	async function confirmTogglePublic(): Promise<void> {
		if (!chartToToggle) return;

		try {
			const response = await fetch(`/api/admin/graficosConfig/${chartToToggle}/toggle-public`, {
				method: 'POST'
			});

			if (!response.ok) throw new Error('Error updating chart visibility');

			const result = await response.json();
			if (result.success) {
				// Update local config
				chartConfigs = chartConfigs.map((c) =>
					c.nombre_grafico === chartToToggle ? { ...c, es_publico: result.data.es_publico } : c
				);
			}
		} catch (err) {
			console.error('Error toggling visibility:', err);
			alert('Error al actualizar la visibilidad del gráfico');
		} finally {
			showConfirmModal = false;
			chartToToggle = null;
		}
	}

	function toggleChartVisibility(chartName: string): void {
		visibleCharts[chartName] = !visibleCharts[chartName];
		visibleCharts = visibleCharts;
	}

	function getPercentage(value: number, total: number): number {
		return total > 0 ? Math.round((value / total) * 100) : 0;
	}

	function formatNumber(num: number): string {
		return new Intl.NumberFormat('es-ES').format(num);
	}

	// ==========================================
	// STATS GRID FUNCTIONS
	// ==========================================
	function toggleStatsGrid(): void {
		statsGridVisible = !statsGridVisible;
		saveStatsGridConfig();
	}

	function toggleStatsGridPublic(): void {
		statsGridPublic = !statsGridPublic;
		saveStatsGridConfig();
	}

	function saveStatsGridConfig(): void {
		if (!browser) return;
		localStorage.setItem(
			'participants_stats_grid_config',
			JSON.stringify({
				visible: statsGridVisible,
				public: statsGridPublic
			})
		);
	}

	// ==========================================
	// CHART VISIBILITY TOGGLES
	// ==========================================
	function toggleFacultades() {
		facultadesVisible = !facultadesVisible;
	}

	function toggleCarreras() {
		carrerasVisible = !carrerasVisible;
	}

	function toggleCargos() {
		cargosVisible = !cargosVisible;
	}

	function toggleGenderPie() {
		genderPieVisible = !genderPieVisible;
	}

	function toggleDirectivaGenero() {
		directivaGeneroVisible = !directivaGeneroVisible;
	}

	function toggleFacultadGenero() {
		facultadGeneroVisible = !facultadGeneroVisible;
	}

	// ==========================================
	// AVATAR HELPER
	// ==========================================
	function getAvatarUrl(url_foto: string | null, nombre: string): string {
		if (url_foto && url_foto.trim() !== '') {
			return url_foto;
		}
		return DEFAULT_AVATAR;
	}

	function getInitial(nombre: string): string {
		return nombre.charAt(0).toUpperCase();
	}

	// ==========================================
	// SOCIAL NETWORKS PARSING
	// ==========================================
	interface SocialNetwork {
		type: string;
		url: string;
		color: string;
		label: string;
	}

	function parseSocialNetworks(redesSociales: string | null): SocialNetwork[] {
		if (!redesSociales) return [];

		const urls = redesSociales
			.split('|')
			.map((url) => url.trim())
			.filter((url) => url);
		const networks: SocialNetwork[] = [];

		urls.forEach((url) => {
			const lowerUrl = url.toLowerCase();

			if (lowerUrl.includes('orcid.org')) {
				networks.push({ type: 'orcid', url, color: '#A6CE39', label: 'ORCID' });
			} else if (lowerUrl.includes('researchgate.net')) {
				networks.push({ type: 'researchgate', url, color: '#00D0AF', label: 'ResearchGate' });
			} else if (lowerUrl.includes('scholar.google')) {
				networks.push({ type: 'google-scholar', url, color: '#4285F4', label: 'Google Scholar' });
			} else if (lowerUrl.includes('academia.edu')) {
				networks.push({ type: 'academia', url, color: '#41454A', label: 'Academia.edu' });
			} else if (lowerUrl.includes('facebook.com')) {
				networks.push({ type: 'facebook', url, color: '#1877F2', label: 'Facebook' });
			} else if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
				networks.push({ type: 'twitter', url, color: '#1DA1F2', label: 'Twitter' });
			} else if (lowerUrl.includes('linkedin.com')) {
				networks.push({ type: 'linkedin', url, color: '#0A66C2', label: 'LinkedIn' });
			} else if (lowerUrl.includes('scopus.com')) {
				networks.push({ type: 'scopus', url, color: '#E9711C', label: 'Scopus' });
			} else {
				networks.push({ type: 'web', url, color: '#718096', label: 'Web' });
			}
		});

		return networks;
	}

	// Mapeo de secciones a nombres de gráficos en grafico_config
	const chartMapping: Record<string, string> = {
		overview: 'participantes_resumen',
		'gender-pie': 'participantes_genero_pie',
		'gender-acreditados': 'participantes_genero_acreditados',
		facultades: 'participantes_top_facultades',
		'facultad-genero': 'participantes_facultad_genero',
		carreras: 'participantes_top_carreras',
		cargos: 'participantes_top_cargos',
		'cargo-genero': 'participantes_cargo_genero',
		investigadores: 'participantes_leaderboard',
		'directiva-genero': 'participantes_directiva_genero'
	};

	function getChartConfig(sectionId: string): GraficoConfig | undefined {
		const chartName = chartMapping[sectionId];
		return chartConfigs.find((c) => c.nombre_grafico === chartName);
	}

	function isChartVisible(sectionId: string): boolean {
		const chartName = chartMapping[sectionId];
		return visibleCharts[chartName] !== false;
	}
</script>

<!-- Visibility Confirmation Modal -->
<VisibilityConfirmModal
	bind:isOpen={showConfirmModal}
	chartConfig={chartConfigs.find((c) => c.nombre_grafico === chartToToggle)}
	onConfirm={confirmTogglePublic}
	onCancel={() => {
		showConfirmModal = false;
		chartToToggle = null;
	}}
/>

<div class="dashboard-container">
	<!-- Header -->
	<div class="dashboard-header">
		<div class="header-title">
			<h1>Dashboard de Participantes</h1>
			{#if lastUpdate}
				<p class="last-update">Última actualización: {lastUpdate} • Se actualiza automáticamente</p>
			{/if}
		</div>
		<div class="header-actions">
			<button
				class="action-btn export-btn"
				on:click={() => (showExportModal = true)}
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
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
					<polyline points="7 10 12 15 17 10" />
					<line x1="12" y1="15" x2="12" y2="3" />
				</svg>
				Exportar Dashboard
			</button>
		</div>
	</div>

	{#if error && !loading}
		{#if error.includes('vistas materializadas') || error.includes('SETUP_INSTRUCTIONS')}
			<div class="setup-error-banner">
				<div class="error-icon">⚠️</div>
				<div class="error-content">
					<h3>Configuración Requerida</h3>
					<p>{error}</p>
					<div class="error-actions">
						<a
							href="https://github.com/Snayderstone/Uyana/blob/main/database/SETUP_INSTRUCTIONS.md"
							target="_blank"
							rel="noopener noreferrer"
							class="setup-link"
						>
							📖 Ver Instrucciones de Configuración
						</a>
						<button class="retry-btn" on:click={() => loadDashboardData()}> 🔄 Reintentar </button>
					</div>
					<details class="error-details">
						<summary>Pasos rápidos de configuración</summary>
						<ol>
							<li>Accede al SQL Editor de tu proyecto Supabase</li>
							<li>Ejecuta el script <code>database/views_participantes.sql</code></li>
							<li>Ejecuta el script <code>database/grafico_config_participantes.sql</code></li>
							<li>Verifica con: <code>SELECT refresh_participantes_stats();</code></li>
							<li>Haz clic en "Reintentar" arriba</li>
						</ol>
					</details>
				</div>
			</div>
		{:else}
			<ErrorState title="Error al cargar dashboard" message={error} onRetry={loadDashboardData} />
		{/if}
	{/if}

	{#if loading && !dashboardData}
		<LoadingState message="Cargando dashboard de participantes..." spinnerSize="large" />
	{:else if dashboardData}
		<!-- Contenido completo sin tabs -->
		<div class="content-wrapper">
			<!-- SECCIÓN: ESTADÍSTICAS GENERALES -->
			<div class="tab-content">
				<!-- Stats Grid Card -->
				<div class="chart-card stats-grid-card" class:collapsed={!statsGridVisible}>
					<div class="chart-header">
						<h3>Estadísticas Generales</h3>
						<div class="chart-actions">
							<button
								class="action-icon-btn"
								class:public={statsGridPublic}
								on:click={toggleStatsGridPublic}
								title={statsGridPublic ? 'Público' : 'Privado'}
							>
								{#if statsGridPublic}
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
								on:click={toggleStatsGrid}
								title={statsGridVisible ? 'Ocultar' : 'Mostrar'}
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
									{#if statsGridVisible}
										<polyline points="18 15 12 9 6 15" />
									{:else}
										<polyline points="6 9 12 15 18 9" />
									{/if}
								</svg>
							</button>
						</div>
					</div>

					{#if statsGridVisible}
						<div class="chart-body stats-grid-body">
							<div class="stats-grid" id="chart-container-participants-stats-grid">
								<StatCard
									icon="projects"
									value={formatNumber(dashboardData.stats.total_participantes)}
									label="Total Participantes"
									variant="default"
								/>

								<StatCard
									icon="completed"
									value={formatNumber(dashboardData.stats.total_acreditados)}
									label="Acreditados"
									percentage={`${getPercentage(
										dashboardData.stats.total_acreditados,
										dashboardData.stats.total_participantes
									)}% del total`}
									variant="default"
								/>

								<StatCard
									icon="progress"
									value={formatNumber(dashboardData.stats.total_masculino)}
									label="Masculino"
									percentage={`${getPercentage(
										dashboardData.stats.total_masculino,
										dashboardData.stats.total_participantes
									)}% del total`}
									variant="default"
								/>

								<StatCard
									icon="progress"
									value={formatNumber(dashboardData.stats.total_femenino)}
									label="Femenino"
									percentage={`${getPercentage(
										dashboardData.stats.total_femenino,
										dashboardData.stats.total_participantes
									)}% del total`}
									variant="default"
								/>
							</div>
						</div>
					{/if}
				</div>

				<!-- SECCIÓN: TOP INVESTIGADORES -->
				<div class="chart-card" id="section-investigadores">
					{#each [getChartConfig('investigadores')] as chartConfig}
						<div class="chart-header">
							<h3>{chartConfig?.titulo_display || '🏆 Top 20 Investigadores'}</h3>
							{#if chartConfig}
								<div class="chart-actions">
									<button
										class="action-icon-btn"
										class:public={chartConfig.es_publico}
										on:click={() => requestTogglePublic(chartConfig.nombre_grafico)}
										title={chartConfig.es_publico ? 'Público' : 'Privado'}
									>
										{#if chartConfig.es_publico}
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
								</div>
							{/if}
						</div>
						<!-- Podio Top 3 -->
						{#if dashboardData.topParticipantes && dashboardData.topParticipantes.length >= 3}
							<div class="podium-container" id="chart-container-top-researchers">
								<!-- 2nd Place -->
								{#each [dashboardData.topParticipantes[1]] as second}
									<div class="podium-place second">
										<div class="medal-container">
											<svg class="medal-svg silver" viewBox="0 0 100 100">
												<circle cx="50" cy="50" r="45" fill="#C0C0C0" />
												<circle cx="50" cy="50" r="35" fill="#E8E8E8" />
												<text
													x="50"
													y="65"
													text-anchor="middle"
													fill="#666"
													font-size="32"
													font-weight="bold">2</text
												>
											</svg>
										</div>
										<div class="podium-avatar">
											<img
												src={getAvatarUrl(second.url_foto, second.participante_nombre)}
												alt={second.participante_nombre}
												on:error={handleImageError}
											/>
										</div>
										<h4 class="podium-name">{second.participante_nombre}</h4>
										<p class="podium-faculty">{second.facultad_nombre}</p>
										{#if second.redes_sociales}
											{@const redes = parseSocialNetworks(second.redes_sociales)}
											{#if redes.length > 0}
												<div class="podium-social">
													{#each redes.slice(0, 4) as red}
														<a
															href={red.url}
															target="_blank"
															rel="noopener noreferrer"
															class="social-link-podium"
															style="background-color: {red.color};"
															title={red.label}
														>
															<svg
																xmlns="http://www.w3.org/2000/svg"
																width="14"
																height="14"
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																stroke-width="2"
																stroke-linecap="round"
																stroke-linejoin="round"
															>
																<path
																	d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
																/>
																<polyline points="15 3 21 3 21 9" />
																<line x1="10" y1="14" x2="21" y2="3" />
															</svg>
														</a>
													{/each}
												</div>
											{/if}
										{/if}
										<div class="podium-stats">
											<div class="podium-stat">
												<span class="stat-value">{second.total_proyectos}</span>
												<span class="stat-label">Proyectos</span>
											</div>
											<div class="podium-stat">
												<span class="stat-value">{second.proyectos_como_director}</span>
												<span class="stat-label">Director</span>
											</div>
										</div>
									</div>
								{/each}

								<!-- 1st Place -->
								{#each [dashboardData.topParticipantes[0]] as first}
									<div class="podium-place first">
										<div class="medal-container">
											<svg class="medal-svg gold" viewBox="0 0 100 100">
												<circle cx="50" cy="50" r="45" fill="#FFD700" />
												<circle cx="50" cy="50" r="35" fill="#FFF4C1" />
												<text
													x="50"
													y="65"
													text-anchor="middle"
													fill="#B8860B"
													font-size="32"
													font-weight="bold">1</text
												>
											</svg>
										</div>
										<div class="podium-avatar">
											<img
												src={getAvatarUrl(first.url_foto, first.participante_nombre)}
												alt={first.participante_nombre}
												on:error={handleImageError}
											/>
										</div>
										<h4 class="podium-name">{first.participante_nombre}</h4>
										<p class="podium-faculty">{first.facultad_nombre}</p>
										{#if first.redes_sociales}
											{@const redes = parseSocialNetworks(first.redes_sociales)}
											{#if redes.length > 0}
												<div class="podium-social">
													{#each redes.slice(0, 4) as red}
														<a
															href={red.url}
															target="_blank"
															rel="noopener noreferrer"
															class="social-link-podium"
															style="background-color: {red.color};"
															title={red.label}
														>
															<svg
																xmlns="http://www.w3.org/2000/svg"
																width="14"
																height="14"
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																stroke-width="2"
																stroke-linecap="round"
																stroke-linejoin="round"
															>
																<path
																	d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
																/>
																<polyline points="15 3 21 3 21 9" />
																<line x1="10" y1="14" x2="21" y2="3" />
															</svg>
														</a>
													{/each}
												</div>
											{/if}
										{/if}
										<div class="podium-stats">
											<div class="podium-stat">
												<span class="stat-value">{first.total_proyectos}</span>
												<span class="stat-label">Proyectos</span>
											</div>
											<div class="podium-stat">
												<span class="stat-value">{first.proyectos_como_director}</span>
												<span class="stat-label">Director</span>
											</div>
										</div>
									</div>
								{/each}
								<!-- 3rd Place -->
								{#each [dashboardData.topParticipantes[2]] as third}
									<div class="podium-place third">
										<div class="medal-container">
											<svg class="medal-svg bronze" viewBox="0 0 100 100">
												<circle cx="50" cy="50" r="45" fill="#CD7F32" />
												<circle cx="50" cy="50" r="35" fill="#E6B88A" />
												<text
													x="50"
													y="65"
													text-anchor="middle"
													fill="#8B4513"
													font-size="32"
													font-weight="bold">3</text
												>
											</svg>
										</div>
										<div class="podium-avatar">
											<img
												src={getAvatarUrl(third.url_foto, third.participante_nombre)}
												alt={third.participante_nombre}
												on:error={handleImageError}
											/>
										</div>
										<h4 class="podium-name">{third.participante_nombre}</h4>
										<p class="podium-faculty">{third.facultad_nombre}</p>
										{#if third.redes_sociales}
											{@const redes = parseSocialNetworks(third.redes_sociales)}
											{#if redes.length > 0}
												<div class="podium-social">
													{#each redes.slice(0, 4) as red}
														<a
															href={red.url}
															target="_blank"
															rel="noopener noreferrer"
															class="social-link-podium"
															style="background-color: {red.color};"
															title={red.label}
														>
															<svg
																xmlns="http://www.w3.org/2000/svg"
																width="14"
																height="14"
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																stroke-width="2"
																stroke-linecap="round"
																stroke-linejoin="round"
															>
																<path
																	d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
																/>
																<polyline points="15 3 21 3 21 9" />
																<line x1="10" y1="14" x2="21" y2="3" />
															</svg>
														</a>
													{/each}
												</div>
											{/if}
										{/if}
										<div class="podium-stats">
											<div class="podium-stat">
												<span class="stat-value">{third.total_proyectos}</span>
												<span class="stat-label">Proyectos</span>
											</div>
											<div class="podium-stat">
												<span class="stat-value">{third.proyectos_como_director}</span>
												<span class="stat-label">Director</span>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}

						<!-- Lista del 4 al 20 -->
						{#if dashboardData.topParticipantes && dashboardData.topParticipantes.length > 3}
							<div class="leaderboard-list">
								{#each dashboardData.topParticipantes.slice(3, 20) as participante, index}
									<div class="leaderboard-item">
										<div class="rank-badge">#{index + 4}</div>
										<div class="participant-avatar-small">
											<img
												src={getAvatarUrl(participante.url_foto, participante.participante_nombre)}
												alt={participante.participante_nombre}
												on:error={handleImageError}
											/>
										</div>
										<div class="participant-details">
											<h5 class="participant-name">{participante.participante_nombre}</h5>
											<p class="participant-subtitle">{participante.facultad_nombre}</p>
											<span class="participant-cargo">{participante.cargo_principal}</span>
											{#if participante.redes_sociales}
												{@const redes = parseSocialNetworks(participante.redes_sociales)}
												{#if redes.length > 0}
													<div class="participant-social">
														{#each redes.slice(0, 5) as red}
															<a
																href={red.url}
																target="_blank"
																rel="noopener noreferrer"
																class="social-link-small"
																style="background-color: {red.color};"
																title={red.label}
															>
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	width="12"
																	height="12"
																	viewBox="0 0 24 24"
																	fill="none"
																	stroke="currentColor"
																	stroke-width="2"
																	stroke-linecap="round"
																	stroke-linejoin="round"
																>
																	<path
																		d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
																	/>
																	<polyline points="15 3 21 3 21 9" />
																	<line x1="10" y1="14" x2="21" y2="3" />
																</svg>
															</a>
														{/each}
													</div>
												{/if}
											{/if}
										</div>
										<div class="participant-metrics">
											<div class="metric-item">
												<span class="metric-value">{participante.total_proyectos}</span>
												<span class="metric-label">Proyectos</span>
											</div>
											<div class="metric-item">
												<span class="metric-value">{participante.proyectos_como_director}</span>
												<span class="metric-label">Director</span>
											</div>
											<div class="metric-item">
												<span class="metric-value">{participante.proyectos_como_investigador}</span>
												<span class="metric-label">Investig.</span>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					{/each}
				</div>

				<!-- SECCIÓN: TOP FACULTADES -->
				<div
					class="chart-card"
					id="chart-container-facultades"
					class:collapsed={!facultadesVisible}
				>
					{#each [getChartConfig('facultades')] as chartConfig}
						<div class="chart-header">
							<h3>{chartConfig?.titulo_display || 'Top 15 Facultades con Más Participantes'}</h3>
							{#if chartConfig}
								<div class="chart-actions">
									<button
										class="action-icon-btn"
										class:public={chartConfig.es_publico}
										on:click={() => requestTogglePublic(chartConfig.nombre_grafico)}
										title={chartConfig.es_publico ? 'Público' : 'Privado'}
									>
										{#if chartConfig.es_publico}
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
										on:click={toggleFacultades}
										title={facultadesVisible ? 'Ocultar' : 'Mostrar'}
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
											{#if facultadesVisible}
												<polyline points="18 15 12 9 6 15" />
											{:else}
												<polyline points="6 9 12 15 18 9" />
											{/if}
										</svg>
									</button>
								</div>
							{/if}
						</div>
						{#if facultadesVisible}
							<div class="bar-chart-container">
								{#each dashboardData.topFacultades || [] as facultad, index}
									{@const maxValue = dashboardData.topFacultades?.[0]?.total_participantes || 1}
									{@const percentage = (facultad.total_participantes / maxValue) * 100}
									<div class="bar-item">
										<div class="bar-label">
											<span class="bar-rank">#{index + 1}</span>
											<span class="bar-name" title={facultad.facultad_nombre}>
												{facultad.facultad_nombre}
											</span>
										</div>
										<div class="bar-container">
											<div class="bar-fill stacked" style="width: {percentage}%">
												<div
													class="bar-segment masculine"
													style="width: {(facultad.masculino / facultad.total_participantes) *
														100}%"
													title="Masculino: {facultad.masculino}"
												/>
												<div
													class="bar-segment feminine"
													style="width: {(facultad.femenino / facultad.total_participantes) * 100}%"
													title="Femenino: {facultad.femenino}"
												/>
											</div>
											<span class="bar-value">{formatNumber(facultad.total_participantes)}</span>
										</div>
										<div class="bar-details">
											<span class="detail masculine">♂ {facultad.masculino}</span>
											<span class="detail feminine">♀ {facultad.femenino}</span>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					{/each}
				</div>

				<!-- SECCIÓN: TOP CARRERAS -->
				<div class="chart-card" id="chart-container-carreras" class:collapsed={!carrerasVisible}>
					{#each [getChartConfig('carreras')] as chartConfig}
						<div class="chart-header">
							<h3>{chartConfig?.titulo_display || 'Top 20 Carreras con Más Participantes'}</h3>
							{#if chartConfig}
								<div class="chart-actions">
									<button
										class="action-icon-btn"
										class:public={chartConfig.es_publico}
										on:click={() => requestTogglePublic(chartConfig.nombre_grafico)}
										title={chartConfig.es_publico ? 'Público' : 'Privado'}
									>
										{#if chartConfig.es_publico}
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
										on:click={toggleCarreras}
										title={carrerasVisible ? 'Ocultar' : 'Mostrar'}
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
											{#if carrerasVisible}
												<polyline points="18 15 12 9 6 15" />
											{:else}
												<polyline points="6 9 12 15 18 9" />
											{/if}
										</svg>
									</button>
								</div>
							{/if}
						</div>
						{#if carrerasVisible}
							<div class="bar-chart-container">
								{#each dashboardData.topCarreras?.slice(0, 10) || [] as carrera, index}
									{@const maxValue = dashboardData.topCarreras?.[0]?.total_participantes || 1}
									{@const percentage = (carrera.total_participantes / maxValue) * 100}
									<div class="bar-item">
										<div class="bar-label">
											<span class="bar-rank">#{index + 1}</span>
											<div class="bar-name-group">
												<span class="bar-name" title={carrera.carrera_nombre}>
													{carrera.carrera_nombre}
												</span>
												<span class="bar-subtitle">{carrera.facultad_nombre}</span>
											</div>
										</div>
										<div class="bar-container">
											<div class="bar-fill gradient" style="width: {percentage}%" />
											<span class="bar-value">{formatNumber(carrera.total_participantes)}</span>
										</div>
										<div class="bar-details">
											<span class="detail masculine">♂ {carrera.masculino}</span>
											<span class="detail feminine">♀ {carrera.femenino}</span>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					{/each}
				</div>

				<!-- SECCIÓN: TOP CARGOS -->
				<div class="chart-card" id="chart-container-cargos" class:collapsed={!cargosVisible}>
					{#each [getChartConfig('cargos')] as chartConfig}
						<div class="chart-header">
							<h3>{chartConfig?.titulo_display || 'Top 10 Cargos Más Frecuentes en Proyectos'}</h3>
							{#if chartConfig}
								<div class="chart-actions">
									<button
										class="action-icon-btn"
										class:public={chartConfig.es_publico}
										on:click={() => requestTogglePublic(chartConfig.nombre_grafico)}
										title={chartConfig.es_publico ? 'Público' : 'Privado'}
									>
										{#if chartConfig.es_publico}
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
										on:click={toggleCargos}
										title={cargosVisible ? 'Ocultar' : 'Mostrar'}
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
											{#if cargosVisible}
												<polyline points="18 15 12 9 6 15" />
											{:else}
												<polyline points="6 9 12 15 18 9" />
											{/if}
										</svg>
									</button>
								</div>
							{/if}
						</div>
						{#if cargosVisible}
							<div class="bar-chart-container">
								{#each dashboardData.topCargos || [] as cargo, index}
									{@const maxValue = dashboardData.topCargos?.[0]?.total_asignaciones || 1}
									{@const percentage = (cargo.total_asignaciones / maxValue) * 100}
									<div class="bar-item">
										<div class="bar-label">
											<span class="bar-rank">#{index + 1}</span>
											<span class="bar-name" title={cargo.cargo_nombre}>
												{cargo.cargo_nombre}
											</span>
										</div>
										<div class="bar-container">
											<div class="bar-fill stacked" style="width: {percentage}%">
												<div
													class="bar-segment masculine"
													style="width: {(cargo.masculino / cargo.total_asignaciones) * 100}%"
													title="Masculino: {cargo.masculino}"
												/>
												<div
													class="bar-segment feminine"
													style="width: {(cargo.femenino / cargo.total_asignaciones) * 100}%"
													title="Femenino: {cargo.femenino}"
												/>
											</div>
											<span class="bar-value">{formatNumber(cargo.total_asignaciones)}</span>
										</div>
										<div class="bar-details">
											<span class="detail masculine">♂ {cargo.masculino}</span>
											<span class="detail feminine">♀ {cargo.femenino}</span>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					{/each}
				</div>

				<!-- SECCIÓN: ANÁLISIS DE GÉNERO -->
				<div class="gender-analysis">
					<!-- Distribución por Género (Pie Chart) -->
					{#each [getChartConfig('gender-pie')] as chartConfig}
						<div
							class="chart-card"
							id="chart-container-gender-pie"
							class:collapsed={!genderPieVisible}
						>
							<div class="chart-header">
								<h3>{chartConfig?.titulo_display || 'Distribución por Género'}</h3>
								{#if chartConfig}
									<div class="chart-actions">
										<button
											class="action-icon-btn"
											class:public={chartConfig.es_publico}
											on:click={() => requestTogglePublic(chartConfig.nombre_grafico)}
											title={chartConfig.es_publico ? 'Público' : 'Privado'}
										>
											{#if chartConfig.es_publico}
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
											on:click={toggleGenderPie}
											title={genderPieVisible ? 'Ocultar' : 'Mostrar'}
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
												{#if genderPieVisible}
													<polyline points="18 15 12 9 6 15" />
												{:else}
													<polyline points="6 9 12 15 18 9" />
												{/if}
											</svg>
										</button>
									</div>
								{/if}
							</div>
							{#if genderPieVisible && dashboardData.stats}
								{@const total = dashboardData.stats.total_participantes}
								{@const masculinoPercent = (dashboardData.stats.total_masculino / total) * 100}
								{@const femeninoPercent = (dashboardData.stats.total_femenino / total) * 100}
								{@const masculinoAngle = (masculinoPercent / 100) * 360}
								{@const femeninoAngle = (femeninoPercent / 100) * 360}

								<div class="gender-distribution">
									<div class="gender-pie">
										<svg viewBox="0 0 200 200" class="pie-chart">
											<!-- Masculino -->
											<circle
												cx="100"
												cy="100"
												r="80"
												fill="none"
												stroke="#3b82f6"
												stroke-width="40"
												stroke-dasharray="{(masculinoAngle / 360) * 502.65} 502.65"
												transform="rotate(-90 100 100)"
											/>

											<!-- Femenino -->
											<circle
												cx="100"
												cy="100"
												r="80"
												fill="none"
												stroke="#ec4899"
												stroke-width="40"
												stroke-dasharray="{(femeninoAngle / 360) * 502.65} 502.65"
												stroke-dashoffset="-{(masculinoAngle / 360) * 502.65}"
												transform="rotate(-90 100 100)"
											/>

											<text x="100" y="95" text-anchor="middle" class="pie-center-text">
												{total}
											</text>
											<text x="100" y="110" text-anchor="middle" class="pie-center-label">
												Total
											</text>
										</svg>
									</div>
									<div class="gender-legend">
										<div class="legend-item">
											<span class="legend-color" style="background: #3b82f6;" />
											<span class="legend-label">Masculino</span>
											<span class="legend-value">
												{formatNumber(dashboardData.stats.total_masculino)} ({masculinoPercent.toFixed(
													1
												)}%)
											</span>
										</div>
										<div class="legend-item">
											<span class="legend-color" style="background: #ec4899;" />
											<span class="legend-label">Femenino</span>
											<span class="legend-value">
												{formatNumber(dashboardData.stats.total_femenino)} ({femeninoPercent.toFixed(
													1
												)}%)
											</span>
										</div>
									</div>
								</div>
							{/if}
						</div>
					{/each}
					<!-- Participación Directiva por Género -->
					<div
						class="chart-card"
						id="chart-container-directiva-genero"
						class:collapsed={!directivaGeneroVisible}
					>
						{#each [getChartConfig('directiva-genero')] as chartConfig}
							<div class="chart-header">
								<h3>
									{chartConfig?.titulo_display || 'Participación en Roles Directivos por Género'}
								</h3>
								{#if chartConfig}
									<div class="chart-actions">
										<button
											class="action-icon-btn"
											class:public={chartConfig.es_publico}
											on:click={() => requestTogglePublic(chartConfig.nombre_grafico)}
											title={chartConfig.es_publico ? 'Público' : 'Privado'}
										>
											{#if chartConfig.es_publico}
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
											on:click={toggleDirectivaGenero}
											title={directivaGeneroVisible ? 'Ocultar' : 'Mostrar'}
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
												{#if directivaGeneroVisible}
													<polyline points="18 15 12 9 6 15" />
												{:else}
													<polyline points="6 9 12 15 18 9" />
												{/if}
											</svg>
										</button>
									</div>
								{/if}
							</div>
							{#if directivaGeneroVisible}
								<div class="directiva-chart">
									{#each dashboardData.participacionDirectiva || [] as item}
										{@const maxValue = Math.max(
											...(dashboardData.participacionDirectiva?.map(
												(i) => i.total_roles_directivos
											) || [1])
										)}
										{@const percentage = (item.total_roles_directivos / maxValue) * 100}
										<div class="directiva-item">
											<div class="directiva-label">
												<span class="gender-icon">
													{item.genero === 'masculino'
														? '♂'
														: item.genero === 'femenino'
														? '♀'
														: '⚧'}
												</span>
												<span class="gender-name">{item.genero}</span>
											</div>
											<div class="directiva-bar-container">
												<div
													class="directiva-bar"
													class:masculine={item.genero === 'masculino'}
													class:feminine={item.genero === 'femenino'}
													style="width: {percentage}%"
												/>
												<span class="directiva-value"
													>{formatNumber(item.total_roles_directivos)}</span
												>
											</div>
											<div class="directiva-details">
												<span>{item.participantes_unicos} participantes únicos</span>
												<span>{item.proyectos_unicos} proyectos</span>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						{/each}
					</div>

					<!-- Facultad × Género -->
					{#each [getChartConfig('facultad-genero')] as chartConfig}
						<div
							class="chart-card"
							id="chart-container-facultad-genero"
							class:collapsed={!facultadGeneroVisible}
						>
							<div class="chart-header">
								<h3>
									{chartConfig?.titulo_display || 'Distribución por Facultad y Género (Top 10)'}
								</h3>
								{#if chartConfig}
									<div class="chart-actions">
										<button
											class="action-icon-btn"
											class:public={chartConfig.es_publico}
											on:click={() => requestTogglePublic(chartConfig.nombre_grafico)}
											title={chartConfig.es_publico ? 'Público' : 'Privado'}
										>
											{#if chartConfig.es_publico}
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
											on:click={toggleFacultadGenero}
											title={facultadGeneroVisible ? 'Ocultar' : 'Mostrar'}
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
												{#if facultadGeneroVisible}
													<polyline points="18 15 12 9 6 15" />
												{:else}
													<polyline points="6 9 12 15 18 9" />
												{/if}
											</svg>
										</button>
									</div>
								{/if}
							</div>
							{#if facultadGeneroVisible}
								<div class="bar-chart-container">
									{#each dashboardData.facultadGenero?.slice(0, 10) || [] as item, index}
										{@const maxValue = dashboardData.facultadGenero?.[0]?.total || 1}
										{@const percentage = (item.total / maxValue) * 100}
										<div class="bar-item">
											<div class="bar-label">
												<span class="bar-rank">#{index + 1}</span>
												<span class="bar-name" title={item.facultad_nombre}>
													{item.facultad_nombre}
												</span>
											</div>
											<div class="bar-container">
												<div class="bar-fill stacked" style="width: {percentage}%">
													<div
														class="bar-segment masculine"
														style="width: {(item.masculino / item.total) * 100}%"
														title="Masculino: {item.masculino}"
													/>
													<div
														class="bar-segment feminine"
														style="width: {(item.femenino / item.total) * 100}%"
														title="Femenino: {item.femenino}"
													/>
												</div>
												<span class="bar-value">{formatNumber(item.total)}</span>
											</div>
											<div class="bar-details">
												<span class="detail masculine">♂ {item.masculino}</span>
												<span class="detail feminine">♀ {item.femenino}</span>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Export Modal -->
<ExportPDFModal
	bind:isOpen={showExportModal}
	dashboardTitle="Dashboard de Participantes"
	availableCharts={availableChartsForExport}
/>

<style lang="scss">
	/* ========== DASHBOARD CONTAINER ========== */
	.dashboard-container {
		padding: 2rem;
		max-width: 100%;
		margin: 0 auto;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* ========== SETUP ERROR BANNER ========== */
	.setup-error-banner {
		display: flex;
		gap: 1.5rem;
		padding: 2rem;
		margin: 2rem 0;
		background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%);
		border: 2px solid #f59e0b;
		border-radius: 12px;
		animation: fadeIn 0.3s ease;

		.error-icon {
			font-size: 3rem;
			flex-shrink: 0;
		}

		.error-content {
			flex: 1;

			h3 {
				color: #f59e0b;
				font-size: 1.5rem;
				margin: 0 0 0.75rem 0;
				font-weight: 700;
			}

			p {
				color: var(--color--text);
				margin: 0 0 1.5rem 0;
				line-height: 1.6;
			}
		}

		.error-actions {
			display: flex;
			gap: 1rem;
			margin-bottom: 1.5rem;
			flex-wrap: wrap;
		}

		.setup-link {
			display: inline-flex;
			align-items: center;
			gap: 0.5rem;
			padding: 0.75rem 1.5rem;
			background: #f59e0b;
			color: white;
			text-decoration: none;
			border-radius: 8px;
			font-weight: 600;
			transition: all 0.2s ease;

			&:hover {
				background: #d97706;
				transform: translateY(-2px);
				box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
			}
		}

		.retry-btn {
			padding: 0.75rem 1.5rem;
			background: var(--color--card-background);
			color: var(--color--text);
			border: 2px solid #f59e0b;
			border-radius: 8px;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s ease;

			&:hover {
				background: rgba(245, 158, 11, 0.1);
				transform: translateY(-2px);
			}
		}

		.error-details {
			margin-top: 1rem;
			padding: 1rem;
			background: var(--color--card-background);
			border-radius: 8px;
			border: 1px solid rgba(245, 158, 11, 0.3);

			summary {
				cursor: pointer;
				font-weight: 600;
				color: #f59e0b;
				user-select: none;
				padding: 0.5rem;

				&:hover {
					color: #d97706;
				}
			}

			ol {
				margin: 1rem 0 0 0;
				padding-left: 1.5rem;
				color: var(--color--text-shade);

				li {
					margin: 0.75rem 0;
					line-height: 1.6;

					code {
						padding: 0.125rem 0.375rem;
						background: rgba(245, 158, 11, 0.1);
						color: #f59e0b;
						border-radius: 4px;
						font-family: 'Courier New', monospace;
						font-size: 0.875rem;
					}
				}
			}
		}
	}

	// Header
	.dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
		gap: 2rem;

		@media (max-width: 768px) {
			flex-direction: column;
		}
	}

	.header-actions {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s var(--ease-out-3);

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}

		svg {
			width: 18px;
			height: 18px;
		}
	}

	.export-btn {
		background: #10b981;
		color: white;

		&:hover:not(:disabled) {
			background: #059669;
			transform: translateY(-1px);
		}
	}

	// Content wrapper
	.content-wrapper {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		position: relative;
		z-index: 1;
	}

	// Stats Grid
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
		margin-bottom: 0; // Sin margen cuando está dentro de chart-card
	}

	// Chart Card
	.chart-card {
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		border-radius: 12px;
		overflow: hidden;
		transition: all 0.3s var(--ease-out-3);
		margin-bottom: 2rem;

		&:hover {
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
			border-color: rgba(var(--color--text-rgb), 0.15);
		}

		> div:not(.chart-header) {
			padding: 1.5rem;
			background: var(--color--card-background);
		}

		// Stats grid dentro de chart-card necesita padding
		.stats-grid {
			padding: 1.5rem;
			margin-bottom: 0;
		}

		&.collapsed {
			background: rgba(var(--color--text-rgb), 0.02);

			.chart-header {
				border-bottom: none;
			}
		}
	}

	.stats-grid-body {
		padding: 1.5rem;
	}

	.chart-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);

		h3 {
			font-size: 1.125rem;
			font-weight: 600;
			color: var(--color--text);
			margin: 0;
		}
	}

	.chart-actions {
		display: flex;
		gap: 0.5rem;
	}

	.action-icon-btn {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: rgba(var(--color--text-rgb), 0.05);
		border-radius: 6px;
		color: var(--color--text);
		cursor: pointer;
		transition: all 0.2s var(--ease-out-3);

		&:hover {
			background: rgba(var(--color--text-rgb), 0.1);
		}

		&.public {
			background: #dcfce7;
			color: #059669;

			&:hover {
				background: #bbf7d0;
			}
		}
	}

	// Legend
	.legend-color {
		width: 24px;
		height: 24px;
		border-radius: 4px;
		flex-shrink: 0;
	}

	.legend-label {
		flex: 1;
		font-weight: 600;
		color: var(--dashboard-text);
	}

	.legend-value {
		font-weight: 700;
		color: var(--dashboard-text-secondary);
	}

	// Bar Charts
	.bar-chart-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.bar-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.bar-label {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.bar-rank {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: var(--dashboard-primary);
		color: white;
		border-radius: 8px;
		font-weight: 700;
		font-size: 0.875rem;
		flex-shrink: 0;
	}

	.bar-name {
		font-weight: 600;
		color: var(--dashboard-text);
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		text-transform: capitalize;
	}

	.bar-name-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
	}

	.bar-subtitle {
		font-size: 0.75rem;
		color: var(--dashboard-text-secondary);
		text-transform: capitalize;
	}

	.bar-container {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding-left: 40px;
	}

	.bar-fill {
		height: 32px;
		border-radius: 6px;
		transition: width 0.6s ease;
		position: relative;
		overflow: hidden;

		&.gradient {
			background: linear-gradient(90deg, var(--dashboard-info), var(--dashboard-primary));
		}

		&.stacked {
			display: flex;
		}
	}

	.bar-segment {
		height: 100%;
		transition: width 0.6s ease;

		&.masculine {
			background: var(--dashboard-info);
		}

		&.feminine {
			background: var(--dashboard-warning);
		}
	}

	.bar-value {
		font-weight: 700;
		color: var(--dashboard-text);
		min-width: 60px;
		text-align: right;
	}

	.bar-details {
		display: flex;
		gap: 1rem;
		padding-left: 40px;
		font-size: 0.875rem;

		.detail {
			display: flex;
			align-items: center;
			gap: 0.25rem;

			&.masculine {
				color: var(--dashboard-info);
			}

			&.feminine {
				color: var(--dashboard-warning);
			}
		}
	}

	// Podium Container
	.podium-container {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		gap: 2rem;
		padding: 2rem;
		margin-bottom: 3rem;
		background: linear-gradient(180deg, rgba(var(--dashboard-primary-rgb), 0.08), transparent);
		border-radius: 12px;
	}

	.podium-place {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 2rem 1.5rem;
		background: var(--dashboard-background);
		border-radius: 16px;
		box-shadow: 0 4px 20px var(--dashboard-card-shadow);
		transition: all 0.3s;
		position: relative;

		&.first {
			order: 2;
			min-width: 280px;
			padding-top: 1.5rem;
			transform: scale(1.1);
			z-index: 3;
			border: 3px solid #ffd700;

			&:hover {
				transform: scale(1.15) translateY(-10px);
				box-shadow: 0 12px 40px rgba(255, 215, 0, 0.3);
			}
		}

		&.second {
			order: 1;
			min-width: 260px;
			border: 3px solid #c0c0c0;

			&:hover {
				transform: translateY(-8px);
				box-shadow: 0 8px 30px rgba(192, 192, 192, 0.3);
			}
		}

		&.third {
			order: 3;
			min-width: 260px;
			border: 3px solid #cd7f32;

			&:hover {
				transform: translateY(-8px);
				box-shadow: 0 8px 30px rgba(205, 127, 50, 0.3);
			}
		}
	}

	.medal-container {
		margin-bottom: 1rem;
	}

	.medal-svg {
		width: 80px;
		height: 80px;
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
		animation: float 3s ease-in-out infinite;

		&.gold {
			animation-delay: 0s;
		}

		&.silver {
			animation-delay: 0.3s;
		}

		&.bronze {
			animation-delay: 0.6s;
		}
	}

	@keyframes float {
		0%,
		100% {
			transform: translateY(0px);
		}
		50% {
			transform: translateY(-10px);
		}
	}

	.podium-avatar {
		width: 100px;
		height: 100px;
		border-radius: 50%;
		overflow: hidden;
		border: 4px solid #fff;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		.first & {
			width: 120px;
			height: 120px;
			border-width: 5px;
		}
	}

	.podium-name {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--dashboard-text);
		margin: 0;
		text-align: center;
		text-transform: capitalize;

		.first & {
			font-size: 1.5rem;
		}
	}

	.podium-faculty {
		font-size: 0.875rem;
		color: var(--dashboard-text-secondary);
		text-align: center;
		margin: 0;
		text-transform: capitalize;
	}

	.podium-social {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		margin: 0.75rem 0;
		flex-wrap: wrap;
	}

	.social-link-podium {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 6px;
		color: white;
		transition: all 0.2s ease;
		text-decoration: none;
	}

	.social-link-podium:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.social-link-podium svg {
		width: 14px;
		height: 14px;
	}

	.podium-stats {
		display: flex;
		gap: 1rem;
		margin-top: 1rem;
		width: 100%;
	}

	.podium-stat {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.75rem;
		background: var(--dashboard-background-alt);
		border-radius: 8px;
		border: 1px solid var(--dashboard-border);

		.stat-value {
			font-size: 1.75rem;
			font-weight: 700;
			color: var(--dashboard-primary);
			line-height: 1;
		}

		.stat-label {
			font-size: 0.75rem;
			color: var(--dashboard-text-secondary);
			margin-top: 0.25rem;
		}
	}

	// Leaderboard List (4-20)
	.leaderboard-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.leaderboard-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.5rem;
		background: var(--dashboard-background);
		border-radius: 12px;
		border: 1px solid var(--dashboard-border);
		transition: all 0.2s;

		&:hover {
			transform: translateX(4px);
			box-shadow: 0 4px 12px var(--dashboard-card-shadow);
			border-color: var(--dashboard-primary);
		}
	}

	.rank-badge {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #6e29e7, #8b5cf6);
		color: white;
		border-radius: 50%;
		font-weight: 700;
		font-size: 1rem;
		flex-shrink: 0;
	}

	.participant-avatar-small {
		width: 50px;
		height: 50px;
		border-radius: 50%;
		overflow: hidden;
		border: 2px solid #fff;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		flex-shrink: 0;

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	.participant-details {
		flex: 1;
		min-width: 0;
	}

	.participant-name {
		font-size: 1rem;
		font-weight: 600;
		color: var(--dashboard-text);
		margin: 0 0 0.25rem 0;
		text-transform: capitalize;
	}

	.participant-subtitle {
		font-size: 0.875rem;
		color: var(--dashboard-text-secondary);
		margin: 0 0 0.25rem 0;
		text-transform: capitalize;
	}

	.participant-cargo {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		background: rgba(var(--dashboard-primary-rgb), 0.15);
		color: var(--dashboard-primary);
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: capitalize;
	}

	.participant-social {
		display: flex;
		gap: 0.375rem;
		margin-top: 0.5rem;
		flex-wrap: wrap;
	}

	.social-link-small {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 5px;
		color: white;
		transition: all 0.2s ease;
		text-decoration: none;
	}

	.social-link-small:hover {
		transform: translateY(-2px);
		box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
	}

	.social-link-small svg {
		width: 12px;
		height: 12px;
	}

	.participant-metrics {
		display: flex;
		gap: 1.5rem;
		align-items: center;
	}

	.metric-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 60px;

		.metric-value {
			font-size: 1.25rem;
			font-weight: 700;
			color: var(--dashboard-text);
			line-height: 1;
		}

		.metric-label {
			font-size: 0.7rem;
			color: var(--color-text-secondary);
			margin-top: 0.25rem;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}
	}

	// Gender Analysis
	.gender-analysis {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.directiva-chart {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.directiva-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.directiva-label {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.gender-icon {
		font-size: 1.5rem;
	}

	.gender-name {
		font-weight: 600;
		text-transform: capitalize;
		color: var(--dashboard-text);
	}

	.directiva-bar-container {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.directiva-bar {
		height: 40px;
		border-radius: 8px;
		transition: width 0.6s ease;

		&.masculine {
			background: linear-gradient(90deg, var(--dashboard-info), #60a5fa);
		}

		&.feminine {
			background: linear-gradient(90deg, var(--dashboard-warning), #f472b6);
		}
	}

	.directiva-value {
		font-weight: 700;
		color: var(--dashboard-text);
		min-width: 80px;
		text-align: right;
	}

	.directiva-details {
		display: flex;
		gap: 1.5rem;
		padding-left: 40px;
		font-size: 0.875rem;
		color: var(--dashboard-text-secondary);
	}

	/* ========== VISIBILITY CONTROLS ========== */
	.chart-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.08);
		background: var(--color--card-background);
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

	/* ========== GENDER DISTRIBUTION (PIE CHART) ========== */
	.gender-distribution {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 3rem;
		align-items: center;
	}

	.gender-pie {
		max-width: 300px;
		margin: 0 auto;
	}

	.pie-chart {
		width: 100%;
		height: auto;
	}

	.pie-center-text {
		font-size: 32px;
		font-weight: 700;
		fill: var(--color--text);
	}

	.pie-center-label {
		font-size: 14px;
		fill: var(--color--text-shade);
	}

	.gender-legend {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: var(--color--card-background);
		border-radius: 8px;
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
	}

	.legend-color {
		width: 24px;
		height: 24px;
		border-radius: 4px;
		flex-shrink: 0;
	}

	.legend-label {
		flex: 1;
		font-weight: 600;
		color: var(--color--text);
	}

	.legend-value {
		font-weight: 700;
		color: var(--color--text-shade);
	}

	/* ========== BAR CHARTS ========== */
	.bar-chart-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.bar-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.bar-label {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.bar-rank {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: var(--color--primary);
		color: white;
		border-radius: 8px;
		font-weight: 700;
		font-size: 0.875rem;
		flex-shrink: 0;
	}

	.bar-name {
		font-weight: 600;
		color: var(--color--text);
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		text-transform: capitalize;
	}

	.bar-name-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
	}

	.bar-subtitle {
		font-size: 0.75rem;
		color: var(--color--text-shade);
		text-transform: capitalize;
	}

	.bar-container {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding-left: 40px;
	}

	.bar-fill {
		height: 32px;
		border-radius: 6px;
		transition: width 0.6s ease;
		position: relative;
		overflow: hidden;

		&.gradient {
			background: linear-gradient(90deg, var(--color--primary), var(--color--primary-shade));
		}

		&.stacked {
			display: flex;
		}
	}

	.bar-segment {
		height: 100%;
		transition: width 0.6s ease;

		&.masculine {
			background: #3b82f6;
		}

		&.feminine {
			background: #ec4899;
		}
	}

	.bar-value {
		font-weight: 700;
		color: var(--color--text);
		min-width: 60px;
		text-align: right;
	}

	.bar-details {
		display: flex;
		gap: 1rem;
		padding-left: 40px;
		font-size: 0.875rem;

		.detail {
			display: flex;
			align-items: center;
			gap: 0.25rem;

			&.masculine {
				color: #3b82f6;
			}

			&.feminine {
				color: #ec4899;
			}
		}
	}

	/* ========== PODIUM ========== */
	.podium-container {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		gap: 2rem;
		padding: 2rem;
		margin-bottom: 3rem;
		background: linear-gradient(
			180deg,
			rgba(var(--color--primary-rgb, 110, 41, 231), 0.08),
			transparent
		);
		border-radius: 12px;
	}

	.podium-place {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 2rem 1.5rem;
		background: var(--color--card-background);
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		transition: all 0.3s;
		position: relative;

		&.first {
			transform: scale(1.1);
			z-index: 3;
		}

		&.second {
			z-index: 2;
		}

		&.third {
			z-index: 1;
		}
	}

	.medal-container {
		margin-bottom: 1rem;
	}

	.medal-svg {
		width: 80px;
		height: 80px;
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
		animation: float 3s ease-in-out infinite;
	}

	@keyframes float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
	}

	.podium-avatar {
		width: 100px;
		height: 100px;
		border-radius: 50%;
		overflow: hidden;
		border: 4px solid var(--color--primary);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		.first & {
			width: 120px;
			height: 120px;
			border-width: 6px;
		}
	}

	.podium-name {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color--text);
		margin: 0;
		text-align: center;
		text-transform: capitalize;

		.first & {
			font-size: 1.5rem;
		}
	}

	.podium-faculty {
		font-size: 0.875rem;
		color: var(--color--text-shade);
		text-align: center;
		margin: 0;
		text-transform: capitalize;
	}

	.podium-stats {
		display: flex;
		gap: 1rem;
		margin-top: 1rem;
		width: 100%;
	}

	.podium-stat {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.75rem;
		background: rgba(var(--color--primary-rgb, 110, 41, 231), 0.1);
		border-radius: 8px;

		.stat-value {
			font-size: 1.25rem;
			font-weight: 700;
			color: var(--color--primary);
		}

		.stat-label {
			font-size: 0.7rem;
			color: var(--color--text-shade);
			text-transform: uppercase;
		}
	}

	/* ========== LEADERBOARD LIST ========== */
	.leaderboard-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.leaderboard-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.5rem;
		background: var(--color--card-background);
		border-radius: 12px;
		border: 1px solid rgba(var(--color--text-rgb), 0.08);
		transition: all 0.2s;

		&:hover {
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
			border-color: var(--color--primary);
		}
	}

	.rank-badge {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, var(--color--primary), var(--color--primary-shade));
		color: white;
		border-radius: 50%;
		font-weight: 700;
		font-size: 1rem;
		flex-shrink: 0;
	}

	.participant-avatar-small {
		width: 50px;
		height: 50px;
		border-radius: 50%;
		overflow: hidden;
		border: 2px solid rgba(var(--color--text-rgb), 0.1);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		flex-shrink: 0;

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	.participant-details {
		flex: 1;
		min-width: 0;
	}

	.participant-name {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color--text);
		margin: 0 0 0.25rem 0;
		text-transform: capitalize;
	}

	.participant-subtitle {
		font-size: 0.875rem;
		color: var(--color--text-shade);
		margin: 0 0 0.25rem 0;
		text-transform: capitalize;
	}

	.participant-cargo {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		background: rgba(var(--color--primary-rgb, 110, 41, 231), 0.15);
		color: var(--color--primary);
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: capitalize;
	}

	.participant-metrics {
		display: flex;
		gap: 1.5rem;
		align-items: center;
	}

	.metric-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;

		.metric-value {
			font-size: 1.25rem;
			font-weight: 700;
			color: var(--color--text);
		}

		.metric-label {
			font-size: 0.7rem;
			color: var(--color--text-shade);
			text-transform: uppercase;
		}
	}

	/* ========== GENDER ANALYSIS ========== */
	.gender-analysis {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.directiva-chart {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.directiva-item {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.directiva-label {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.gender-icon {
		font-size: 1.5rem;
	}

	.gender-name {
		font-weight: 600;
		color: var(--color--text);
		text-transform: capitalize;
	}

	.directiva-bar-container {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.directiva-bar {
		height: 32px;
		border-radius: 6px;
		transition: width 0.6s ease;

		&.masculine {
			background: #3b82f6;
		}

		&.feminine {
			background: #ec4899;
		}
	}

	.directiva-value {
		font-weight: 700;
		color: var(--color--text);
		min-width: 60px;
		text-align: right;
	}

	.directiva-details {
		display: flex;
		gap: 1.5rem;
		padding-left: 0.5rem;
		font-size: 0.875rem;
		color: var(--color--text-shade);
	}

	/* ========== RESPONSIVE ========== */
	@media (max-width: 1024px) {
		.gender-distribution {
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
		}

		.action-btn {
			flex: 1;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}

		.podium-container {
			gap: 1rem;
		}

		.podium-place.first {
			transform: scale(1.05);
		}

		.podium-avatar {
			width: 80px;
			height: 80px;

			.first & {
				width: 96px;
				height: 96px;
			}
		}

		.gender-distribution {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.participant-metrics {
			flex-direction: column;
			gap: 0.5rem;
			align-items: flex-start;
		}
	}
</style>
